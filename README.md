# Aplicativo móvel Ionic, Vue, Capacitor e Supabase

Implementação prática de autenticação, recuperação de senha, perfil persistido no Supabase e foto privada no Storage.

## Arquitetura e ferramentas

- **Ionic Framework** fornece os componentes de interface e a estrutura de navegação adaptada para dispositivos móveis.
- **Vue 3** organiza cada tela em componentes `.vue`; `ref` e `computed` mantêm os campos e estados da interface reativos.
- **Vue Router** separa as telas e protege as rotas que exigem uma sessão autenticada.
- **Capacitor** conecta o aplicativo web aos recursos nativos. O plugin `@capacitor/camera` captura a foto; um seletor de arquivo também está disponível para a web.
- **Supabase Auth** autentica por e-mail e senha e envia o link de redefinição.
- **Supabase Database** armazena nome, nickname, data de nascimento e o caminho da foto na tabela `profiles`.
- **Supabase Storage** guarda a imagem no bucket privado `avatars`. A política limita leitura e gravação à pasta do próprio usuário; a interface usa uma URL assinada temporária para exibi-la.

O fluxo é: login → boas-vindas → edição do perfil. A redefinição de senha abre a rota `/password-reset` a partir do link enviado por e-mail. O navegador e o aplicativo usam as mesmas telas; em plataformas nativas, a câmera é acessada pelo Capacitor.

## Configuração do Supabase

1. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os valores públicos do seu projeto Supabase. Não use uma chave `service_role` no aplicativo.
2. No SQL Editor do Supabase, execute [`supabase/schema.sql`](./supabase/schema.sql). O script cria `profiles`, habilita RLS com políticas por usuário e cria o bucket privado com limite de 5 MB e tipos de imagem permitidos.
3. Em **Authentication → URL Configuration**, inclua a URL da aplicação e a URL de redirecionamento `/password-reset` na lista de redirecionamentos permitidos. Por exemplo, durante o desenvolvimento com Vite: `http://localhost:5173/password-reset` (ajuste à porta usada pelo seu servidor).
4. Reinicie o servidor depois de criar ou alterar `.env.local`.

## Executar

```sh
npm install
npm run dev
```

Para validar a compilação e o TypeScript:

```sh
npm run build
```

Para usar a câmera em um dispositivo, adicione a plataforma Capacitor desejada e sincronize os plugins nativos:

```sh
npx cap add android
npx cap sync
```

No iOS, use `npx cap add ios` em um ambiente macOS. O plugin de câmera solicita permissão em tempo de execução; o sistema operacional também pode exigir uma descrição de uso da câmera na configuração nativa.

## Telas implementadas

- `/login`: login e solicitação de recuperação de senha.
- `/password-reset`: grava uma nova senha após abrir o link válido enviado pelo Supabase.
- `/profile`: carrega e grava os dados do usuário e envia a foto para o bucket privado.
- `/welcome`: mensagem personalizada com o nome do perfil, acesso à edição e encerramento de sessão.
