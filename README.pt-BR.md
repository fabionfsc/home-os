# Home OS

Uma tela inicial minimalista para TVs Samsung Tizen: paisagens, relógio, clima e ícones fornecidos pela própria TV. Derivado de [berteotti/custom-tv](https://github.com/berteotti/custom-tv), com licença MIT e crédito preservado.

## O que está pronto

- Apps consultados ao vivo pela API Tizen, com atualização por eventos, ao retornar à tela e a cada 60 segundos enquanto visível.
- Ícones nativos, sem títulos embaixo e sem instruções no rodapé. Apps novos não dependem de um inventário do computador.
- Português brasileiro, português de Portugal, inglês, espanhol, francês, alemão e italiano: 120 mensagens em cada catálogo, incluindo erros e condições do tempo.
- Relógio, clima de Brasília configurável em `js/config.js`, previsão de sete dias e modo ambiente.
- Oito paisagens opcionais de um catálogo histórico do Chromecast, com crédito e troca a cada dez minutos. Paisagens locais ilustrativas servem de alternativa sem rede.
- CSS consolidado, remoção de código morto, carregador de ícones compartilhado, reaproveitamento de cards quando a lista não muda, prevenção de pedidos duplicados de clima e pausa do trabalho periódico quando oculto.

## Limites

Home OS é um aplicativo web, não um sistema operacional ou firmware. A casinha e o Voltar mantêm o comportamento Samsung. O retorno global ao Home OS ainda não foi resolvido; a tentativa anterior foi desfeita e não está neste pacote. O botão Menu da TV abre o menu original.

O antecessor Sala 2.1.0 foi verificado em uma QN55Q70A com Tizen 6.0. A limpeza 3.0.0 passou pelos testes unitários e de navegador, mas ainda precisa de validação própria na TV. Outros modelos podem exigir adaptação dos metadados e caminhos de ícones.

`js/native-icons.js` contém dicas de caminho do cache de marcas conhecidas. A lista de apps é dinâmica; um app novo com ícone genérico na API pode precisar de um alias. O catálogo de wallpapers é histórico e não é uma API oficial estável do Google. As fotografias pertencem aos seus autores.

## Rodar e testar

Use Node.js 22 ou mais recente e pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm start
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:ui
pnpm test:ui --dist
```

A prévia abre em http://127.0.0.1:4173 e não inventa apps instalados. Os testes usam dados explícitos próprios. A compilação minificada para Chromium 76 fica em `dist/`; os fontes legíveis ficam em `js/` e `css/`.

## Instalar

Após compilar, use o Tizen SDK, Developer Mode e seu próprio perfil Samsung autorizado para a TV:

```powershell
./tools/install.ps1 -SdkPath 'C:\caminho\tizen-sdk' -Profile 'seu-perfil' -TvIp 'IP_DA_TV'
```

Certificados, senhas, SDK, pacotes assinados pessoais e ferramentas de root não estão incluídos. O instalador não muda os botões. O ID `TvHomeLnch.Home` foi mantido para permitir atualização com o mesmo certificado; o nome exibido é Home OS. As preferências existentes são preservadas.

A tela lógica é 1920 × 1080, ajustada ao espaço entregue pelo Tizen; isso não altera a resolução física da TV nem a reprodução de outros apps.

Consulte o [README em inglês](README.md), o [histórico de mudanças](CHANGELOG.md) e os [créditos de terceiros](THIRD_PARTY_NOTICES.md).
