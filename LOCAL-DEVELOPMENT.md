# FITA — código principal

Esta é a pasta principal do código local: ~/Projects/FITA. O projeto foi retirado do iCloud.

- desktop/: interface e app macOS.
- engine/: transcrição, agrupamento de vozes e memória local.
- test/: testes de revisão e persistência.
- build.command: testa, empacota e instala em /Applications/FITA.app.

O build usa os runtimes e ferramentas já instalados neste Mac. A configuração desktop/config.json aponta para o workspace de processamento original; não é um pacote portátil para outro Mac. Os caminhos antigos de código são links para esta pasta, evitando cópias divergentes.

Os dados ativos, áudios, revisões e vozes ficam em ~/Library/Application Support/FITA. A pasta data contém os resultados anteriores de desenvolvimento.

## Reconhecimento e revisão

Ao atribuir uma pessoa, é possível confirmar também os trechos ainda sem nome do mesmo grupo de voz. Atribuições existentes são preservadas. UNASSIGNED nunca é propagado como grupo.

Um exemplo limpo confirmado de 3–30 segundos atualiza o perfil de voz e dispara comparações nas gravações prontas. As sugestões podem ser confirmadas por grupo; não viram identidade ou treinamento sem confirmação. As representações de áudio ficam em cache para evitar extraí-las novamente a cada exemplo.
