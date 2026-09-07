# FITA :**

App local de transcrição e memória de vozes para o Mac de Rafael.

Abra **FITA** em Aplicativos. O pacote também está em `../FITA-darwin-arm64/FITA.app`.

## Uso

- **Gravações:** importar vários arquivos, detectar duplicatas e manter o histórico.
- **Fila:** acompanhar etapas, pausar os próximos itens, cancelar e tentar novamente.
- **Revisar:** ouvir o original, pular para um trecho, corrigir texto, atribuir uma pessoa a qualquer trecho e exportar. **Guardar exemplo de voz** é uma ação separada para trechos limpos de 3–30 segundos. Atribuições manuais não treinam a memória; renomear um trecho atualiza o nome exibido e exportado.
- **Pessoas:** biblioteca de exemplos confirmados, utilizada para sugestões em novas gravações.
- **Ajustes:** ver o motor, guardar vocabulário e reduzir a atmosfera Aura.

Atalhos: `⌘O` importa; `⌘1–4` muda de seção; `↑↓` percorre gravações; `Enter` abre; `Espaço` toca/pausa; `/` busca; `Esc` volta; `?` ajuda. Menus nativos do Mac têm as mesmas funções principais.

## Build = atualizar Aplicativos

Execute `build.command`. O processo testa a interface, empacota, assina localmente, verifica a assinatura e instala a nova cópia em `/Applications/FITA.app`. A instalação anterior fica em `/Applications/.FITA-previous.app` até o próximo build. Os dados não ficam dentro do pacote e não são substituídos.

Cada build copia o código atual para o app instalado. Alterações entram quando a versão nova é aberta; não há reminder nem busca periódica de atualizações. O app instalado usa motor, modelos e dados em `~/Library/Application Support/FITA`. O workspace guarda o projeto e uma cópia dos resultados desta sessão. O build sincroniza os scripts do motor sem sobrescrever memórias e gravações.

Este é um build local para este Mac, com Chromium incluído e dependências de inferência já instaladas na pasta de suporte do FITA. Ainda não é um instalador portátil/notarizado. O build reutiliza o Electron/packager instalado com ATLAS. O script de testes usa dados separados em `work/ui-test-data` e não corrige a gravação real.

## O que roda localmente

- Whisper large-v3 completo como padrão, com tempos por palavra nativos. Janelas de 120 segundos com 5 segundos de contexto nas bordas e normalização dinâmica numa cópia temporária do áudio.
- Qwen3-ASR fica preservado nas transcrições antigas; o botão **Nova transcrição** cria outra versão sem sobrescrever texto ou correções anteriores.
- FoxNoseTech/diarize e WeSpeaker ResNet34-LM para separar de uma a seis vozes.
- Exemplos de vozes confirmados, comparação de embeddings e sugestões conservadoras. Similaridade não é probabilidade calibrada.
- Vocabulário confirmado usado como contexto de próximas transcrições; não há treinamento automático dos pesos.

Referências técnicas: [Qwen3-ASR](https://huggingface.co/Qwen/Qwen3-ASR-1.7B), [implementação MLX](https://github.com/moona3k/mlx-qwen3-asr), [diarize](https://github.com/FoxNoseTech/diarize).

## Dados e limites da primeira versão

`~/Library/Application Support/FITA/Recordings/queue.json` guarda a fila do app instalado. Cada gravação tem uma pasta própria com original, transcrição, timestamps, separação de vozes, correções e identidades confirmadas por intervalo. O texto original permanece separado das edições. A biblioteca e memória de vocabulário do app instalado estão em `~/Library/Application Support/FITA/Engine`. O diretório `../local-transcriber` contém os scripts de desenvolvimento.

A identidade confirmada vale para o trecho escolhido; não declara automaticamente que todo um agrupamento de voz está correto. A comparação futura sugere nomes, mas não confirma identidades. Mais exemplos podem ajudar; o ganho ainda precisa de avaliação em gravações reais.

A cobertura multilíngue não significa qualidade uniforme nem validação de todos os idiomas. Vozes sobrepostas, mídia ao fundo, nomes e mudanças de língua podem gerar erros. Esta versão de diarize não modela sobreposição. A alternativa pyannote Community-1 depende de acesso Hugging Face e está no backlog para comparação.

Ao encerrar o app, uma transcrição iniciada pelo próprio app é interrompida e permanece disponível para tentar novamente. A primeira gravação desta sessão foi iniciada externamente e é acompanhada pelo app até concluir. Retomada por checkpoint e execução em segundo plano estão no backlog.

Confira `../FITA-PHASES.md` para Phase 1, Phase 2 / Karaokê e Phase 3 / áudios de cinco horas ou mais. Esses itens não são recursos já implementados.

## Auditoria e troca do motor

A auditoria da gravação original está em `../accuracy-audit/RELATORIO.md`. O Whisper melhorou leituras específicas e também omitiu/alterou palavras. Não há escuta humana nem precisão medida contra referência. VibeVoice-ASR está em avaliação separada, sem ser promovido por tamanho ou marketing. Cinco horas ou mais ficam para Phase 3.
