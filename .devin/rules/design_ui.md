---
trigger: always_on
---

# Design UI — Rapport Tecnologia

Aplicar em toda criação ou alteração de interface, componente visual, estilo CSS, dashboard ou gráfico.

## Metodologia

- Aplique Design Thinking e Double Diamond na construção da UX.
- Desenvolva interfaces finas com melhor aproveitamento de espaço: dados bem expostos e claros.
- Use linhas visíveis para destacar bordas dos cards.
- Priorize densidade informacional sem sacrificar legibilidade.
- Mantenha consistência visual entre todos os componentes do sistema.

## Paleta de Cores

O frontend utiliza **Tailwind CSS** com a paleta **slate** (fundo/texto) e
**brand** (laranja/orange scale), conforme definido em `tailwind.config.js`
e `globals.css`. As cores institucionais da Rapport (extraídas do site
rapport.tec.br) servem de inspiração, mas a implementação real usa as
classes Tailwind abaixo.

### Cores Brand (Tailwind orange scale)

Definidas em `tailwind.config.js` sob `theme.extend.colors.brand`:

| Token Tailwind | Hex | Uso |
| :--- | :---: | :--- |
| `brand-300` | `#fdba74` | Hover de links e ícones |
| `brand-400` | `#fb923c` | Links, ícones de destaque, texto de código |
| `brand-500` | `#f97316` | Hover de botões primários, bordas de foco |
| `brand-600` | `#ea580c` | Botões primários, estados ativos do menu |
| `brand-700` | `#c2410c` | Estados pressionados |
| `brand-800` | `#9a3412` | Estados escuros |
| `brand-900` | `#7c2d12` | Estados muito escuros |

### Cores Slate (Tailwind)

Usadas para fundo, texto, bordas e cards em todo o frontend:

| Token Tailwind | Hex | Uso |
| :--- | :---: | :--- |
| `slate-950` | `#020617` | Fundo principal do body (`bg-slate-950`) |
| `slate-900` | `#0f172a` | Fundo de cards (`bg-slate-900/60`), inputs |
| `slate-800` | `#1e293b` | Bordas de cards, fundo de botões secundários, hover |
| `slate-700` | `#334155` | Bordas de inputs, separadores |
| `slate-400` | `#94a3b8` | Texto muted, placeholders |
| `slate-300` | `#cbd5e1` | Texto secundário, labels |
| `slate-100` | `#f1f5f9` | Texto principal do body (`text-slate-100`) |
| `white` | `#ffffff` | Texto de títulos e strong, texto em botões primários |

### Classes utilitárias do frontend

Definidas em `globals.css`:

| Classe | Equivalente Tailwind | Uso |
| :--- | :--- | :--- |
| `.card` | `rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur` | Cards de conteúdo |
| `.btn-primary` | `btn bg-brand-600 text-white hover:bg-brand-500` | Botões primários |
| `.btn-secondary` | `btn border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700` | Botões secundários |
| `.input` | `border border-slate-700 bg-slate-900 text-slate-100 focus:border-brand-500` | Campos de formulário |
| `.label` | `text-sm font-medium text-slate-300` | Labels de formulário |

## Mapeamento para Dashboards e Gráficos

Aplicar em Chart.js, vis-network e bibliotecas de visualização, mantendo
consistência com a paleta slate + brand do frontend:

| Elemento | Modo Escuro (default) | Modo Claro (print) |
| :--- | :---: | :---: |
| Fundo principal | `#020617` (slate-950) | `#ffffff` |
| Fundo de cards | `rgba(15,23,42,0.6)` (slate-900/60) | `#f1f5f9` (slate-100) |
| Texto principal | `#f1f5f9` (slate-100) | `#020617` (slate-950) |
| Texto secundário (muted) | `#cbd5e1` (slate-300) | `#334155` (slate-700) |
| Links / ícones | `#fb923c` (brand-400) | `#ea580c` (brand-600) |
| Títulos / destaque | `#fb923c` (brand-400) | `#ea580c` (brand-600) |
| Bordas | `#1e293b` (slate-800) | `#cbd5e1` (slate-300) |
| Botão primário | `#ea580c` (brand-600) | `#ea580c` (brand-600) |
| Botão primário hover | `#f97316` (brand-500) | `#f97316` (brand-500) |
| Risco ALTO | `#ea580c` (brand-600) | `#ea580c` (brand-600) |
| Risco MODERADO | `#fdba74` (brand-300) | `#fdba74` (brand-300) |
| Risco CONTROLADO | `#fb923c` (brand-400) | `#fb923c` (brand-400) |
| Chart.js defaults.color | `#94a3b8` (slate-400) | `#334155` (slate-700) |
| Chart.js defaults.borderColor | `#1e293b` (slate-800) | `#cbd5e1` (slate-300) |

### Paleta de gráficos (21 cores, ambos os modos)

Mantendo a identidade laranja/slate do frontend:

```
#ea580c, #fb923c, #f97316, #fdba74, #c2410c, #9a3412, #7c2d12, #431407,
#020617, #0f172a, #1e293b, #334155, #475569, #64748b, #94a3b8, #cbd5e1,
#e2e8f0, #f1f5f9, #fed7aa, #ffedd5, #fff7ed
```
