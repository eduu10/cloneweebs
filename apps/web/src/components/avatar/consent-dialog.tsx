"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: (data: { fullName: string; documentId: string }) => void;
  isLoading?: boolean;
}

const CONSENT_TEXT = `TERMO DE CONSENTIMENTO PARA CRIAÇÃO DE AVATAR DIGITAL

Ao prosseguir com a criação do avatar digital, você declara que:

1. CONSENTIMENTO INFORMADO: Está ciente de que suas imagens faciais serão utilizadas para treinar um modelo de inteligência artificial capaz de gerar representações digitais da sua aparência.

2. FINALIDADE: As imagens e o avatar gerado serão utilizados exclusivamente para os fins da plataforma CloneWeebs IA, incluindo geração de conteúdo visual com sua representação digital.

3. DIREITOS DO TITULAR: Conforme a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), você tem direito a:
   - Acessar seus dados pessoais tratados pela plataforma;
   - Solicitar a correção de dados incompletos ou desatualizados;
   - Solicitar a exclusão dos dados e do avatar gerado;
   - Revogar este consentimento a qualquer momento.

4. ARMAZENAMENTO: Suas imagens e dados serão armazenados de forma segura e criptografada. Os dados brutos de treinamento serão eliminados após a conclusão do processo.

5. COMPARTILHAMENTO: Suas imagens e avatar NÃO serão compartilhados com terceiros sem seu consentimento expresso adicional.

6. REVOGAÇÃO: Você pode revogar este consentimento a qualquer momento através das configurações da plataforma, o que resultará na exclusão do avatar e dados associados.

Ao clicar em "Concordo e Continuar", você confirma que leu, compreendeu e aceita os termos acima descritos.`;

export function ConsentDialog({
  open,
  onOpenChange,
  onConsent,
  isLoading = false,
}: ConsentDialogProps) {
  const [accepted, setAccepted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");

  const canSubmit = accepted && fullName.trim().length >= 2 && documentId.trim().length >= 5;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConsent({ fullName: fullName.trim(), documentId: documentId.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Termo de Consentimento (LGPD)"
        description="Leia o termo completo antes de continuar"
        className="max-w-2xl"
      >
        {/* Scrollable consent text */}
        <div
          className="mb-4 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface p-4 text-sm text-gray-300 whitespace-pre-wrap"
          tabIndex={0}
          role="document"
          aria-label="Termo de consentimento"
        >
          {CONSENT_TEXT}
        </div>

        {/* Checkbox de aceite */}
        <label className="mb-4 flex items-start gap-3 cursor-pointer text-sm text-gray-300">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 accent-violet-500"
          />
          <span>Li e concordo com os termos de consentimento acima descritos</span>
        </label>

        {/* Identity fields */}
        <div className="space-y-3">
          <Input
            label="Nome completo"
            placeholder="Seu nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={!accepted}
          />
          <Input
            label="CPF ou Documento de Identidade"
            placeholder="000.000.000-00"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            disabled={!accepted}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            isLoading={isLoading}
          >
            Concordo e Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
