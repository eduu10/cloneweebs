"""Video generation service using gTTS + FFmpeg.

Produces real MP4 files with text overlay, solid background, and TTS narration.
"""

import json
import logging
import subprocess
import textwrap
import uuid
from dataclasses import dataclass
from pathlib import Path

from gtts import gTTS

logger = logging.getLogger(__name__)

OUTPUT_DIR = Path("/tmp/cloneweebs-videos")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

RESOLUTION_WIDTH = 1280
RESOLUTION_HEIGHT = 720
FONT_SIZE = 32
WATERMARK_FONT_SIZE = 18
DEFAULT_LANGUAGE = "pt"
DEFAULT_BG_COLOR = "0x1a1a2e"
TEXT_COLOR = "white"
WATERMARK_TEXT = "CloneWeebs IA"
MAX_LINE_LENGTH = 45


@dataclass(frozen=True)
class VideoResult:
    """Immutable result of video generation."""

    file_path: str
    duration_seconds: float
    file_size_bytes: int


def _wrap_script(script: str) -> str:
    """Word-wrap script text for overlay display."""
    lines = textwrap.wrap(script, width=MAX_LINE_LENGTH)
    return "\n".join(lines)


def _get_audio_duration(audio_path: str) -> float:
    """Probe audio file duration using ffprobe."""
    result = subprocess.run(
        [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            audio_path,
        ],
        capture_output=True,
        text=True,
        check=True,
        timeout=30,
    )
    info = json.loads(result.stdout)
    return float(info["format"]["duration"])


def _escape_ffmpeg_text(text: str) -> str:
    """Escape special characters for FFmpeg drawtext filter."""
    replacements = [
        ("\\", "\\\\\\\\"),
        ("'", "\\\\\\'"),
        ('"', '\\\\\\"'),
        (":", "\\\\:"),
        ("%", "\\\\%"),
    ]
    escaped = text
    for old, new in replacements:
        escaped = escaped.replace(old, new)
    return escaped


def generate_video(
    script: str,
    language: str = DEFAULT_LANGUAGE,
    bg_color: str = DEFAULT_BG_COLOR,
) -> VideoResult:
    """Generate an MP4 video with TTS audio and text overlay.

    Args:
        script: The narration text.
        language: Language code for gTTS (e.g. "pt", "en", "es").
        bg_color: Background color in FFmpeg hex format (e.g. "0x1a1a2e").

    Returns:
        VideoResult with file path, duration, and file size.

    Raises:
        ValueError: If script is empty.
        RuntimeError: If audio or video generation fails.
    """
    if not script or not script.strip():
        raise ValueError("Script text must not be empty.")

    video_id = str(uuid.uuid4())
    audio_path = str(OUTPUT_DIR / f"{video_id}.mp3")
    video_path = str(OUTPUT_DIR / f"{video_id}.mp4")

    try:
        # Step 1: Generate TTS audio
        logger.info("Generating TTS audio for video %s", video_id)
        tts = gTTS(text=script, lang=language, slow=False)
        tts.save(audio_path)

        # Step 2: Get audio duration
        duration = _get_audio_duration(audio_path)
        logger.info("Audio duration: %.2f seconds", duration)

        # Step 3: Build FFmpeg command
        wrapped_text = _wrap_script(script)
        escaped_text = _escape_ffmpeg_text(wrapped_text)
        escaped_watermark = _escape_ffmpeg_text(WATERMARK_TEXT)

        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            # Generate solid color video
            "-f", "lavfi",
            "-i", (
                f"color=c={bg_color}:s={RESOLUTION_WIDTH}x{RESOLUTION_HEIGHT}"
                f":d={duration}:r=24"
            ),
            # Audio input
            "-i", audio_path,
            # Video filters: centered text + watermark
            "-vf", (
                f"drawtext=text='{escaped_text}'"
                f":fontcolor={TEXT_COLOR}:fontsize={FONT_SIZE}"
                f":x=(w-text_w)/2:y=(h-text_h)/2"
                f":line_spacing=12"
                f","
                f"drawtext=text='{escaped_watermark}'"
                f":fontcolor=gray:fontsize={WATERMARK_FONT_SIZE}"
                f":x=w-tw-20:y=h-th-20"
            ),
            # Encoding settings
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "stillimage",
            "-c:a", "aac",
            "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            "-shortest",
            video_path,
        ]

        logger.info("Running FFmpeg for video %s", video_id)
        result = subprocess.run(
            ffmpeg_cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0:
            logger.error("FFmpeg stderr: %s", result.stderr)
            raise RuntimeError(f"FFmpeg failed with code {result.returncode}: {result.stderr[-500:]}")

        output_path = Path(video_path)
        if not output_path.exists() or output_path.stat().st_size == 0:
            raise RuntimeError("FFmpeg produced no output file.")

        file_size = output_path.stat().st_size
        logger.info("Video generated: %s (%d bytes, %.2fs)", video_path, file_size, duration)

        return VideoResult(
            file_path=video_path,
            duration_seconds=duration,
            file_size_bytes=file_size,
        )

    except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as exc:
        raise RuntimeError(f"Video generation process failed: {exc}") from exc

    finally:
        # Clean up intermediate audio file
        audio = Path(audio_path)
        if audio.exists():
            audio.unlink()
