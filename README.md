## Este projeto alcançou o 3º lugar na competição Havan Labs + Lovable – Vibe Coding 🚀

## HalfLifeDog - Log Viewer

Um problema comum em toda empresa grande é a quantidade exorbitante de logs que nossos sistemas geram todos os dias.

Isso faz com que times que façam análise percam muito tempo lidando com logs.

E quando a operação está parada, tempo não é só dinheiro — 👉 é impacto direto no negócio.

Foi pensando exatamente nesse problema que nasceu o Log Viewer - Um facilitador completo para análise, diagnóstico e tomada de decisão.

O funcionamento é simples.
Você importa qualquer log — seja do .NET, direto de um pod Kubernetes, ou do Datadog — e, já na tela inicial, o sistema entrega valor.

De imediato, você enxerga:

Quantidade de erros críticos
Tempo médio de execução
Tempo da pior execução
E outros indicadores que ajudam a entender rapidamente o cenário

A partir daí, ir direto ao ponto fica fácil:
Filtrar por nível de log, por classe do .NET, por contexto.
Sem ruído. Sem perder tempo. Direto no problema.

Chega de perder tempo analisando logs.
Se a operação parou, precisamos ser rápidos, objetivos e eficientes.

<img width="1447" height="900" alt="havan log viewer" src="https://github.com/user-attachments/assets/46d1d1c3-be2c-494d-ba30-9e67b4b2e085" />


## 1️⃣ Funcionalidades Básicas:

### 📥 Importação inteligente

Upload de: .txt; .log; .jsonl

Fallback para linhas inválidas (log quebrado)

Preview antes de importar

### 🧾 Grid de logs altamente customizável

Cada linha do log vira um registro com colunas como:

Timestamp (com timezone)
LogLevel
Category
EventId
Message
HttpMethod (extraído do State ou Scopes)
Uri
StatusCode
ElapsedMilliseconds

Funcionalidades da grade:

Ordenação multi-coluna
Filtros por coluna
Busca textual global (Message + Category)
Colunas configuráveis (mostrar/ocultar)

Agrupamento por:

LogLevel
Category
EventId

## 2️⃣ Funcionalidades de produtividade (ganho real no dia a dia)

### 🎯 Filtros inteligentes (sem escrever regex)

Filtro rápido por nível:

❌ Errors
⚠️ Warnings
ℹ️ Information

Filtros prontos:

Apenas chamadas HTTP
Apenas falhas (StatusCode ≥ 400)
Requests lentos (Elapsed > X ms)

### 🔗 Correlação de eventos

Start processing
Sending HTTP request
Received HTTP response
End processing

## 3️⃣ Visualizações e insights

### 📊 Dashboards automáticos

Volume de logs por LogLevel

Tempo médio

Erros por Category

### ⏱️ Análise de performance HTTP

Especial para o padrão do HttpClient:

Tempo total:

Diferença entre Start processing e End processing

Comparação:

ElapsedMilliseconds vs tempo total

Identificação de gargalos:

Muitos requests rápidos vs poucos lentos

Presets:

ASP.NET Core default
Serilog
NLog

## 4️⃣ Funcionalidades de exportação e compartilhamento

Exportar:

CSV
Excel
JSON filtrado

Compartilhar:

Estado da grade (filtros + ordenação)
Snapshot de um request específico

Copiar como:

Markdown
Texto formatado para Jira / Azure DevOps

