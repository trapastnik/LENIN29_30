// ФАЙЛ СГЕНЕРИРОВАН: node scripts/design/brand-lint.mjs --report
// Читает brand.html, раздел «Состояние дизайн-кода».
// Снят на коммите 63124c8 — если в каталоге чужой хеш,
// значит отчёт не пересобирали, и числа старые.
window.MTK_LINT = {
  "commit": "63124c8",
  "total": 407,
  "rules": {
    "R1": {
      "title": "сырой hex вне tokens.json и исключений",
      "level": "error",
      "count": 359,
      "files": {
        "brand.html": 68,
        "project.html": 2,
        "public/expo/direction-a.jsx": 92,
        "public/expo/direction-b.jsx": 28,
        "public/expo/direction-c.jsx": 28,
        "public/expo/people-ui.jsx": 104,
        "public/expo/shared.jsx": 7,
        "scripts/export_venn_svg.mjs": 11,
        "src/components/camp-filter.js": 5,
        "src/components/map-unit.js": 1,
        "src/components/party-card.js": 1,
        "src/components/state-card.js": 4,
        "src/components/venn-selector.js": 8
      }
    },
    "R2": {
      "title": "var(--цвет, запас) — запас это скрытая вторая палитра",
      "level": "error",
      "count": 11,
      "files": {
        "src/components/camp-filter.js": 4,
        "src/components/party-card.js": 1,
        "src/components/state-card.js": 2,
        "src/components/venn-selector.js": 4
      }
    },
    "R3": {
      "title": "курсив на Nolde / --font-display",
      "level": "error",
      "count": 34,
      "files": {
        "brand.html": 7,
        "project.html": 2,
        "public/expo/direction-a.jsx": 8,
        "public/expo/direction-b.jsx": 3,
        "public/expo/direction-c.jsx": 5,
        "public/expo/shared.jsx": 3,
        "src/components/party-card.js": 1,
        "src/components/state-card.js": 1,
        "src/components/venn-selector.js": 1,
        "states.html": 3
      }
    },
    "R4": {
      "title": "var(--x) для несуществующего токена",
      "level": "error",
      "count": 0,
      "files": {}
    },
    "R5": {
      "title": ":hover в киосковом коде",
      "level": "error",
      "count": 0,
      "files": {}
    },
    "R6": {
      "title": "внешний CDN — киоск офлайн",
      "level": "error",
      "count": 3,
      "files": {
        "brand.html": 2,
        "project.html": 1
      }
    },
    "R7": {
      "title": "тач-цель меньше 64px — порог управляющего элемента (§1)",
      "level": "error",
      "count": 0,
      "files": {}
    },
    "R8": {
      "title": "артефакты разошлись с tokens.json",
      "level": "error",
      "count": 0,
      "files": {}
    },
    "R9": {
      "title": "var(--метрика) без запаса — приёмочный параметр отвалится молча",
      "level": "error",
      "count": 0,
      "files": {}
    },
    "R10": {
      "title": "цвет слоя в map.json мимо словаря --map-*",
      "level": "error",
      "count": 0,
      "files": {}
    }
  },
  "allow": 3
};
