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

## Bootstrap local do motor

O código não carrega runtimes, modelos, áudios ou dados pessoais para o Git. Neste Mac, eles ficam em `~/Library/Application Support/FITA`:

- `Runtime/asr`: ambiente Python usado pelo Whisper/MLX.
- `Runtime/speakers`: ambiente Python usado pela separação de vozes.
- `Runtime/bin/ffmpeg`: conversor de áudio local.
- `Models`: cache do modelo `mlx-community/whisper-large-v3-mlx` na revisão usada pelo motor.
- `Recordings`: fila, áudio original, transcrições e correções do app.

Para preparar um Mac novo, instale `uv`, crie os dois ambientes com Python 3.12 e instale os arquivos travados em `engine/requirements-asr.lock.txt` e `engine/requirements-speakers.lock.txt`. Instale também o FFmpeg em `Runtime/bin/ffmpeg`. O modelo Whisper é obtido do Hugging Face para `Models` quando ainda não existir; ele não deve ser commitado nem copiado para dentro de `FITA.app`.

Antes de rodar `build.command`, instale as dependências Node de `package.json` e crie `desktop/config.json` a partir de `desktop/config.example.json`, apontando `workspace` para este checkout. O build copia somente os scripts do motor para a pasta de suporte e preserva `Recordings`, perfis de voz e o cache de modelos.
