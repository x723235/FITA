# FITA — próximos capítulos :**

Nome escolhido por Rafael em 7 de setembro de 2026: **FITA**.

## Base em construção nesta sessão

- Transcrição local, priorizando precisão e mantendo os idiomas falados.
- Migração de Qwen3-ASR para Whisper large-v3 completo; vozes separadas com WeSpeaker/diarize.
- Gravações, fila persistente, revisão com áudio, exportação e pessoas.
- Memória de vozes alimentada por exemplos cuja identidade Rafael confirma.
- Correções separadas do texto original; vocabulário confirmado para transcrições futuras.
- Não prometer reconhecimento perfeito nem aprendizagem automática dos pesos do modelo.

## Phase 1 — o FITA com a nossa cara

### Direção visual e experiência

- [ ] Refinar o visual além do primeiro ATLAS: identidade própria, com personalidade de arquivo sonoro, sem cair numa dashboard genérica.
- [x] Revisitar a conversa do re-do do ATLAS e o código/screenshots do resultado: organização antes de personagem, hierarquia clara, contexto acessível e navegação completa pelo teclado.
- [x] Revisitar Floating Focus: Ambient e Aura, presença difusa, orbes violeta/ciano/coral, textura e profundidade.
- [ ] Trazer o fundo Floating Focus para o FITA, preservando contraste de texto e controles. A versão inicial pode reinterpretar Aura; integração com a câmera é trabalho separado.
- [ ] Controles simples para intensidade, movimento e desligar o fundo. Respeitar redução de movimento do sistema.
- [ ] Referências Windows 95/98/2000/XP/Vista, boot/BIOS e ASCII como linguagem de organização. Menus precisam fazer sentido sem decorar atalhos.
- [ ] Revisar fluxos reais usando o app: importar vários áudios, esperar, interromper, retomar, encontrar algo, ouvir, corrigir, identificar pessoa e exportar.
- [ ] Considerar só contexto recente relevante de Rafael para o produto; não transformar detalhes privados dos chats em decoração da interface.

### Precisão, idiomas e vozes que ficam familiares

- [x] Comparar Qwen com Whisper large-v3 completo e turbo; relatório em `accuracy-audit/RELATORIO.md`. Comparação sem escuta humana não mede precisão absoluta.
- [x] Ensaio local VibeVoice-ASR em dois recortes: apresentação recuperada, vocativos ainda instáveis; relatório em `accuracy-audit/VIBEVOICE-TESTE.md`.
- [ ] Ampliar a avaliação do VibeVoice-ASR antes de considerá-lo padrão.
- [ ] Avaliar pyannote Community-1 com acesso autorizado; comparar separação de vozes e sobreposições na gravação real.
- [ ] Conjunto de avaliação confirmado: português BR/PT, alemão de Berlim, francês, espanhol latino/ibérico/com sotaque brasileiro, italiano, árabe, turco e trocas dentro da frase.
- [ ] Enrolar vozes conhecidas por confirmação, com vários trechos limpos e diversos idiomas/ambientes.
- [ ] Calibrar limiares de identificação por pessoa com positivos e negativos reais; similaridade não é probabilidade de identidade.
- [ ] Detectar perfis misturados, desfazer exemplo incorreto, renomear/unir pessoas e excluir exemplos escolhidos.
- [ ] Reutilizar embeddings calculados, comparar com perfis conhecidos e medir ganho de velocidade e de precisão.
- [ ] Separar claramente: voz sugerida, identidade confirmada, texto corrigido e vocabulário aprendido.
- [ ] Corrigir uma atribuição de pessoa sem forçar que todo o agrupamento automático seja dela.
- [ ] Backups locais/exportáveis da biblioteca, histórico de correções e versões dos modelos.

### App de Mac, fila e continuidade

- [ ] Retomada por trecho/checkpoint depois de fechar o app; hoje um job interrompido precisa ser reiniciado.
- [ ] Execução em segundo plano e menu da barra do macOS com estado real da fila.
- [ ] Notificações só quando concluir ou precisar de ação; sem avisos repetitivos.
- [ ] Gerenciador de modelos: tamanho, progresso de download, armazenamento e remoção explícita.
- [ ] Build portátil com runtime próprio, migração do diretório de dados, assinatura/notarização para distribuição.
- [ ] Exportar legendas SRT/VTT e nomes confirmados; preservar proveniência de texto, intervalos e edições.

## Phase 2 — FITA Karaokê :>

Pedido de Rafael: letras aparecem junto com Floating Focus, estilo Spotify.

- [ ] Investigar APIs/fontes de letras sincronizadas e seus direitos de exibição: disponibilidade real, preço, regiões, cache, atribuição e restrições.
- [ ] Verificar o que APIs oficiais de Spotify e Apple Music expõem para faixa atual, posição e letras; não presumir que a API do player fornece letras.
- [ ] Comparar fontes autorizadas de letras temporizadas e importação local de LRC/SRT quando o usuário já tiver o material.
- [ ] Distinguir dois modos: acompanhar música comercial com letra autorizada; acompanhar voz/áudio local com texto e alinhamento produzidos pelo FITA.
- [ ] Sincronizar playback, pausa, seek e troca de faixa; oferecer ajuste manual de atraso.
- [ ] Renderizar linha atual e próximas linhas sobre Floating Focus, com controles discretos e ótima leitura.
- [ ] Integrar Ambient/Aura e recorte opcional da pessoa sem competir com as letras.
- [ ] Explorar destaque por palavra quando a fonte fornecer tempos suficientes, sem inventar precisão.
- [ ] Controles de teclado e menu da barra; modo tela cheia e picture-in-picture.
- [ ] Fazer protótipo com áudio/letra autorizados e testar sincronização real antes de prometer integração com streaming.

## Phase 3 — gravações de 5 horas ou mais

Adiado explicitamente por Rafael; não iniciar nesta troca de modelo.

- [ ] Dividir em pausas com sobreposição controlada e verificar falas nas bordas.
- [ ] Salvar checkpoints e retomar após fechar o app ou reiniciar o Mac.
- [ ] Manter consistência dos falantes entre trechos e gravações, com confirmações e perfis de voz.
- [ ] Reprocessar apenas trechos suspeitos com outro modelo.
- [ ] Limitar uso de memória e disco; progresso real, pausa, cancelamento e retomada.
- [ ] Validar texto, tempos e falantes separadamente com uma gravação real de cinco horas ou mais fornecida por Rafael.

## Referências de continuidade

- ATLAS: task “Find current Miro discounts”, 6–7 setembro; crítica explícita à interface colorida sem usabilidade e posterior migração para Electron.
- Floating Focus: conversa de 1 setembro; evolução para câmera própria, menu ASCII, Ambient, Aura e efeitos combináveis.
- Nesta conversa: prioridades de precisão multilíngue, 1–6 pessoas, aprendizagem de vozes, nome FITA, Phase 1 e Phase 2.

Itens são backlog para depois; não representam recursos já entregues nem automações agendadas.
