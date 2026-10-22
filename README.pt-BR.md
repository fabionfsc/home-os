# Home OS

Uma tela inicial minimalista para TVs Samsung Tizen: paisagens, relógio, clima e ícones fornecidos pela própria TV. Derivado de [berteotti/custom-tv](https://github.com/berteotti/custom-tv), com licença MIT e crédito preservado.

## Funcionalidades

- Apps consultados ao vivo pela API Tizen, com atualização por eventos, ao retornar à tela e a cada 60 segundos enquanto visível.
- Ícones originais da TV em cards minimalistas, sem títulos embaixo.
- Português brasileiro, português de Portugal, inglês, espanhol, francês, alemão e italiano.
- Relógio, clima de Brasília configurável em `js/config.js`, previsão de sete dias e modo ambiente.
- Oito paisagens opcionais de um catálogo histórico do Chromecast, com crédito e troca a cada dez minutos. Paisagens locais ilustrativas servem de alternativa sem rede.
- Transições rápidas, efeitos de clima ajustáveis e modo ambiente.

## Limites

Home OS é um aplicativo web para Tizen. Abra-o pela lista de aplicativos da TV; o menu original continua acessível pelo botão Menu da TV. A integração como tela inicial padrão, incluindo a casinha e o comportamento de retorno, está planejada.

Testado em uma Samsung QN55Q70A com Tizen 6.0 / Chromium 76. A compatibilidade com outros modelos e firmwares pode variar.

Apps novos são detectados automaticamente. Alguns firmwares podem exigir ajustes nos caminhos de ícones. O catálogo de wallpapers é histórico e não é uma API oficial estável do Google. As fotografias pertencem aos seus autores.

## Prévia e compilação

Use Node.js 22 ou mais recente e pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm start
pnpm build
```

A prévia abre em http://127.0.0.1:4173. A descoberta e abertura dos aplicativos exigem uma TV. O aplicativo compilado fica em `dist/`; instruções de desenvolvimento e testes estão em [CONTRIBUTING.md](CONTRIBUTING.md).

## Instalar

Após compilar, use o Tizen SDK, Developer Mode e seu próprio perfil Samsung autorizado para a TV:

```powershell
./tools/install.ps1 -SdkPath 'C:\caminho\tizen-sdk' -Profile 'seu-perfil' -TvIp 'IP_DA_TV'
```

O instalador assina, instala e abre o aplicativo usando seu próprio perfil Samsung. Atualizações exigem o mesmo certificado de autor. O instalador não altera o roteamento dos botões.

### Instalação assistida por IA

Você pode usar Codex, Claude Code ou outro assistente com acesso ao terminal para preparar o SDK, compilar e instalar. Abra o repositório no assistente e envie:

> Instale o Home OS de https://github.com/fabionfsc/home-os na minha TV Samsung Tizen. Leia o README e os scripts de instalação primeiro. Identifique meu sistema operacional, localize ou ajude a instalar o Tizen SDK com suporte Samsung TV, instale as dependências e compile o app. Peça o IP da TV e meu perfil de assinatura Samsung quando necessário. Use o instalador adequado para assinar, instalar e abrir o app. Explique os passos que eu precisar concluir na TV ou no gerenciador de certificados. Preserve o roteamento atual de Home/Voltar e os outros aplicativos.

O Developer Mode e a autorização do certificado Samsung podem exigir etapas manuais. Faça você mesmo o login e a criação do certificado quando solicitado; o assistente não contorna esses requisitos.

A tela lógica é 1920 × 1080, ajustada ao espaço entregue pelo Tizen; isso não altera a resolução física da TV nem a reprodução de outros apps.

Consulte o [README em inglês](README.md), o [histórico de mudanças](CHANGELOG.md) e os [créditos de terceiros](THIRD_PARTY_NOTICES.md).
