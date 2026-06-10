# Bolão da Copa — Visão Geral do Projeto

**Data:** 10 de junho de 2026

---

## O que é isso?

Um bolão online para apostar nos jogos do Brasil na Copa do Mundo. Os participantes preveem o placar de cada jogo, pagam via PIX, e disputam um prêmio dividido entre os três primeiros colocados no ranking.

Todo o controle é manual: você (o admin) abre as rodadas de apostas, confirma os pagamentos e cadastra os resultados. Sem automação, sem complicação.

---

## Como funciona pra quem aposta

1. **Acessa o site** e cria uma conta — com e-mail ou de forma anônima (sem cadastro completo).
2. **Espera a fase abrir.** Você (admin) abre cada fase quando os jogos estão definidos (fase de grupos, oitavas, quartas, etc.).
3. **Faz os palpites** — informa quantos gols o Brasil e o adversário vão fazer em cada jogo.
4. **Vê a chave PIX** e o valor a pagar. Faz o pagamento pelo próprio app do banco.
5. **Aguarda a confirmação.** Quando você confirmar o pagamento, os palpites ficam travados — não dá mais pra editar.
6. **Acompanha o ranking** conforme os jogos acontecem e os resultados vão sendo lançados.

---

## Como funciona pra você (o admin)

1. **Abre a fase.**
   - **Fase de grupos:** os três jogos do Brasil já estão cadastrados no sistema. Só abrir.
   - **Fase eliminatória:** clica em "buscar próximo jogo" — o sistema consulta uma API pública de futebol e traz automaticamente o adversário, data e horário do próximo jogo do Brasil.
2. **Monitora os pagamentos pendentes** — aparece uma lista com quem apostou e ainda não foi confirmado.
3. **Confirma os pagamentos** um a um quando receber o PIX.
4. **Lança o resultado** depois que o jogo termina (gols do Brasil e do adversário).
5. **Calcula os pontos** — um clique recalcula o ranking.
6. **Encerra a fase** e abre a próxima.

---

## Pontuação

| Situação | Pontos |
|---|---|
| Acertou o placar exato | **5 pontos** |
| Acertou o resultado (vitória/empate), mas não o placar | **3 pontos** |
| Acertou os gols de um dos times | **1 ponto** |
| Errou tudo | 0 pontos |
| Não apostou | 0 pontos |

O maior critério vale. Se acertou o placar exato, são 5 pontos — não soma com os outros.

---

## Ranking e premiação

O ranking é ordenado por:
1. Total de pontos (maior primeiro)
2. Número de placares exatos (desempate)
3. Data do primeiro palpite confirmado (quem apostou primeiro fica à frente em caso de empate total)

**Premiação:** o prêmio é dividido entre os **três primeiros**:
- 🥇 1º lugar: **60%** do valor total arrecadado
- 🥈 2º lugar: **30%**
- 🥉 3º lugar: **10%**

---

## Conta anônima vs. conta com e-mail

Qualquer pessoa pode apostar — não precisa criar conta com e-mail. Mas contas anônimas ficam presas ao navegador. Se a pessoa limpar o histórico ou trocar de dispositivo, perde o acesso à conta.

O app vai mostrar um aviso recomendando que quem entrou de forma anônima vincule um e-mail pra não perder os palpites.

---

## Pagamento via PIX

A chave PIX fica cadastrada no sistema (você define antes de abrir). Após o participante enviar os palpites, ele vê a chave e o valor. Ele paga pelo banco normalmente e aguarda a confirmação manual de você.

Não tem detecção automática — você confirma no painel quando ver o pagamento na sua conta.

---

## Visual e tecnologia

- **Visual:** inspirado no Blaze (blaze.com) — fundo escuro, alto contraste, cores vibrantes, tipografia bold, cards de jogos. Visual de site de apostas esportivas, não de painel administrativo.
- **Tecnologia:** Next.js, Supabase, TypeScript, Tailwind CSS. Simples e sem dependências desnecessárias.
- **Hospedagem:** qualquer plataforma que suporte Next.js (Vercel, Railway, etc.).

---

## O que não está incluído (por ora)

- Detecção automática de pagamento PIX
- Ligas privadas ou convite por link
- Notificações por e-mail ou push
- Importação automática/agendada de jogos (sempre manual, acionado por você)
- Apostas em jogos além dos do Brasil
- App mobile nativo

---

## Dúvidas em aberto

| Ponto | Status |
|---|---|
| Valor da entrada por fase | Definir antes de abrir — variável de ambiente |
| Nome do participante anônimo | Pedido no primeiro palpite |
| Empate no 3º lugar no ranking | A decidir — dividir igualmente ou admin decide |
