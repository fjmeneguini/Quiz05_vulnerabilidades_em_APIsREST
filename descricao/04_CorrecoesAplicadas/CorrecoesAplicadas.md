# Correcoes que eu fiz no projeto

Esse arquivo e so um resumo rapido do que foi ajustado depois da versao vulneravel.

## 1. Auth (JWT)

Arquivos: `auth-service/routes/auth.js` e `auth-service/.env`

O que mudei:
- agora o `JWT_SECRET` e obrigatorio (minimo 32 chars)
- o token passa a expirar (`JWT_EXPIRES_IN=15m`)
- adicionei `issuer` e `audience`
- na verificacao eu travei algoritmo em `HS256`
- login sem username/senha agora volta `400`

## 2. BOLA no product-service

Arquivo: `product-service/routes/products.js`

O que mudei:
- o `POST /products` nao aceita mais `userId` no body
- produto novo sempre fica com `req.user.id`
- `GET /products` mostra so produtos do usuario logado
- `GET /products/:id`, `PUT /products/:id` e `DELETE /products/:id` agora checam dono
- validei `price` para ser numero e maior que zero
- validei header no formato `Bearer token`

## 3. Endpoint interno de debug

Arquivos: `product-service/routes/products.js` e `product-service/.env`

O que mudei:
- `GET /products/internal/debug` agora pede token
- por padrao ele fica desligado (`ENABLE_INTERNAL_DEBUG=false`)
- quando liga, retorna so dados do usuario logado

## 4. Como testar rapido

1. Faz login e pega token
2. Espera expirar e testa de novo: deve voltar `401`
3. Tenta acessar produto de outro usuario: deve bloquear (`404`)
4. Testa `http://localhost:3002/products/internal/debug` sem token: `401`
5. Com token e `ENABLE_INTERNAL_DEBUG=false`: `404`

## 5. Observacao

Os arquivos da pasta `descricao` sobre vulnerabilidades antigas continuam no projeto porque fazem parte da explicacao da atividade.
