// ВНИМАНИЕ: файл сгенерирован. Не редактировать.
// Источник: public/expo/direction-a.jsx
// Пересобрать: node scripts/expo/build-jsx.mjs
const { theme: t, fonts: f } = window;
const MAP_REGIONS = [
  {
    id: "nw",
    ru: "\u0421\u0463\u0432\u0435\u0440\u043E-\u0417\u0430\u043F\u0430\u0434\u044A",
    en: "North-West",
    bbox: { x: 40, y: 190, w: 220, h: 200 },
    evByYear: {
      1918: {
        ru: "\u041C\u0430\u0440\u0442\u044A \u2014 \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u044A \u0441\u0442\u043E\u043B\u0438\u0446\u044B \u0432\u044A \u041C\u043E\u0441\u043A\u0432\u0443. \u0410\u043D\u0433\u043B\u043E-\u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u0456\u0439 \u0434\u0435\u0441\u0430\u043D\u0442\u044A \u0432\u044A \u041C\u0443\u0440\u043C\u0430\u043D\u0441\u043A\u0463 (\u043C\u0430\u0440\u0442\u044A) \u0438 \u0410\u0440\u0445\u0430\u043D\u0433\u0435\u043B\u044C\u0441\u043A\u0463 (\u0430\u0432\u0433\u0443\u0441\u0442\u044A).",
        en: "March \u2014 capital moved to Moscow. Anglo-French landings at Murmansk (March) and Arkhangelsk (August)."
      },
      1919: {
        ru: "\u041C\u0430\u0435\u043C \u0438 \u043E\u0441\u0435\u043D\u044C\u044E \u2014 \u043F\u043E\u0445\u043E\u0434\u044B \u042E\u0434\u0435\u043D\u0438\u0447\u0430 \u043D\u0430 \u041F\u0435\u0442\u0440\u043E\u0433\u0440\u0430\u0434\u044A. 21 \u043E\u043A\u0442\u044F\u0431\u0440\u044F \u043E\u0442\u0431\u0438\u0442\u044A \u0443 \u041F\u0443\u043B\u043A\u043E\u0432\u0430 \u0422\u0440\u043E\u0446\u043A\u0438\u043C\u044A.",
        en: "In May and autumn \u2014 Yudenich marches on Petrograd. Repulsed at Pulkovo on 21 October by Trotsky."
      },
      1920: {
        ru: "\u041C\u0438\u0440\u043D\u044B\u0435 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u044B \u0441\u044A \u042D\u0441\u0442\u043E\u043D\u0456\u0435\u0439 (\u042E\u0440\u044C\u0435\u0432\u0441\u043A\u0456\u0439), \u041B\u0430\u0442\u0432\u0456\u0435\u0439, \u041B\u0438\u0442\u0432\u043E\u0439, \u0424\u0438\u043D\u043B\u044F\u043D\u0434\u0456\u0435\u0439. \u0424\u0440\u043E\u043D\u0442\u044A \u0437\u0430\u043A\u0440\u044B\u0442\u044A.",
        en: "Peace treaties with Estonia (Tartu), Latvia, Lithuania, Finland. The front is closed."
      },
      1921: {
        ru: "1\u201418 \u043C\u0430\u0440\u0442\u0430 \u2014 \u041A\u0440\u043E\u043D\u0448\u0442\u0430\u0434\u0442\u0441\u043A\u043E\u0435 \u0432\u043E\u0437\u0441\u0442\u0430\u043D\u0456\u0435. \u0422\u0443\u0445\u0430\u0447\u0435\u0432\u0441\u043A\u0456\u0439 \u0448\u0442\u0443\u0440\u043C\u0443\u0435\u0442\u044A \u043B\u0435\u0434\u044A \u0424\u0438\u043D\u0441\u043A\u0430\u0433\u043E \u0437\u0430\u043B\u0438\u0432\u0430. \xAB\u0417\u0430 \u0441\u043E\u0432\u0463\u0442\u044B \u0431\u0435\u0437\u044A \u043A\u043E\u043C\u043C\u0443\u043D\u0438\u0441\u0442\u043E\u0432\u044A\xBB.",
        en: "1\u201318 March \u2014 Kronstadt uprising. Tukhachevsky storms the ice of the Gulf of Finland. \u201CSoviets without communists.\u201D"
      },
      1922: {
        ru: "\u0413\u043E\u043B\u043E\u0434\u044A \u043E\u0442\u0441\u0442\u0443\u043F\u0430\u0435\u0442\u044A. \u041F\u0435\u0442\u0440\u043E\u0433\u0440\u0430\u0434\u044A \u2014 \u0438\u0437\u043C\u043E\u0436\u0434\u0435\u043D\u044A, \u043D\u0430\u0441\u0435\u043B\u0435\u043D\u0456\u0435 \u0441\u043E\u043A\u0440\u0430\u0442\u0438\u043B\u043E\u0441\u044C \u0432\u0442\u0440\u043E\u0435 \u043F\u0440\u043E\u0442\u0438\u0432\u044A 1917.",
        en: "The famine recedes. Petrograd is exhausted: population down to a third of 1917 levels."
      }
    }
  },
  {
    id: "center",
    ru: "\u0426\u0435\u043D\u0442\u0440\u0430\u043B\u044C\u043D\u0430\u044F \u0420\u043E\u0441\u0441\u0456\u044F",
    en: "Central Russia",
    bbox: { x: 175, y: 330, w: 170, h: 120 },
    evByYear: {
      1918: {
        ru: "5\u20146 \u0456\u044E\u043B\u044F \u2014 \u0432\u043E\u0437\u0441\u0442\u0430\u043D\u0456\u0435 \u043B\u0463\u0432\u044B\u0445\u044A \u044D\u0441\u0435\u0440\u043E\u0432\u044A \u0432\u044A \u041C\u043E\u0441\u043A\u0432\u0463. 30 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 \u2014 \u043F\u043E\u043A\u0443\u0448\u0435\u043D\u0456\u0435 \u041A\u0430\u043F\u043B\u0430\u043D \u043D\u0430 \u041B\u0435\u043D\u0438\u043D\u0430 \u0443 \u0437\u0430\u0432\u043E\u0434\u0430 \u041C\u0438\u0445\u0435\u043B\u044C\u0441\u043E\u043D\u0430.",
        en: "5\u20136 July \u2014 Left SR uprising in Moscow. 30 August \u2014 Kaplan\u2019s attempt on Lenin at the Mikhelson factory."
      },
      1919: {
        ru: "13 \u043E\u043A\u0442\u044F\u0431\u0440\u044F \u2014 \u041E\u0440\u0451\u043B\u044A \u0443 \u0414\u0435\u043D\u0438\u043A\u0438\u043D\u0430. \u0414\u043E \u041C\u043E\u0441\u043A\u0432\u044B \u2014 380 \u0432\u0451\u0440\u0441\u0442\u044A. 20 \u043E\u043A\u0442\u044F\u0431\u0440\u044F \u2014 \u041E\u0440\u0451\u043B\u044A \u043E\u0442\u0431\u0438\u0442\u044A \u043A\u0440\u0430\u0441\u043D\u044B\u043C\u0438.",
        en: "13 October \u2014 Denikin takes Orel. Just 380 versts to Moscow. 20 October \u2014 the Reds retake Orel."
      },
      1920: {
        ru: "\u0422\u044B\u043B\u044A. \u041C\u043E\u0441\u043A\u0432\u0430 \u2014 \u0441\u0442\u0430\u0432\u043A\u0430 \u0421\u041D\u041A \u0438 \u0420\u0412\u0421\u0420, \u043E\u0442\u043A\u0443\u0434\u0430 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0432\u043E\u0439\u043D\u0430 \u043D\u0430 \u0432\u0441\u0463\u0445\u044A \u0444\u0440\u043E\u043D\u0442\u0430\u0445\u044A.",
        en: "The rear. Moscow hosts the Sovnarkom and Revvoensovet, directing the war on all fronts."
      },
      1921: {
        ru: "\u041C\u0430\u0440\u0442\u044A \u2014 X \u0421\u044A\u0463\u0437\u0434\u044A \u043F\u0430\u0440\u0442\u0456\u0438, \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u044A \u043A\u044A \u041D\u042D\u041F\u0443. \u0413\u043E\u043B\u043E\u0434\u044A \u0432\u044A \u0426\u0435\u043D\u0442\u0440\u0430\u043B\u044C\u043D\u043E\u0439 \u0420\u043E\u0441\u0441\u0456\u0438 \u043D\u0435 \u0442\u0430\u043A\u044A \u043E\u0441\u0442\u0435\u0440\u044A, \u043A\u0430\u043A\u044A \u0432\u044A \u041F\u043E\u0432\u043E\u043B\u0436\u044C\u0463.",
        en: "March \u2014 10th Party Congress, transition to NEP. Famine in Central Russia is less acute than on the Volga."
      },
      1922: {
        ru: "\u041C\u0430\u0435\u043C\u044A \u2014 \u041B\u0435\u043D\u0438\u043D\u044A \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u0438\u0442\u044A \u043F\u0435\u0440\u0432\u044B\u0439 \u0443\u0434\u0430\u0440\u044A. \u0414\u0435\u043A\u0430\u0431\u0440\u044C \u2014 I \u0421\u044A\u0463\u0437\u0434\u044A \u0421\u043E\u0432\u0463\u0442\u043E\u0432\u044A \u0421\u0421\u0421\u0420 \u0432\u044A \u041C\u043E\u0441\u043A\u0432\u0463.",
        en: "May \u2014 Lenin suffers his first stroke. December \u2014 1st Congress of Soviets of the USSR, held in Moscow."
      }
    }
  },
  {
    id: "south",
    ru: "\u042E\u0433\u044A \xB7 \u0414\u043E\u043D\u044A \xB7 \u041A\u0440\u044B\u043C\u044A",
    en: "South \xB7 Don \xB7 Crimea",
    bbox: { x: 140, y: 420, w: 270, h: 150 },
    evByYear: {
      1918: {
        ru: "\u0424\u0435\u0432\u0440\u0430\u043B\u044C\u2014\u0430\u043F\u0440\u0463\u043B\u044C \u2014 \u041B\u0435\u0434\u044F\u043D\u043E\u0439 \u043F\u043E\u0445\u043E\u0434\u044A \u041A\u043E\u0440\u043D\u0438\u043B\u043E\u0432\u0430. 13 \u0430\u043F\u0440\u0463\u043B\u044F \u2014 \u0433\u0438\u0431\u0435\u043B\u044C \u041A\u043E\u0440\u043D\u0438\u043B\u043E\u0432\u0430 \u0443 \u0415\u043A\u0430\u0442\u0435\u0440\u0438\u043D\u043E\u0434\u0430\u0440\u0430. \u0414\u0435\u043A\u0430\u0431\u0440\u044C \u2014 \u0432\u0437\u044F\u0442\u0456\u0435 \u0420\u043E\u0441\u0442\u043E\u0432\u0430 \u043A\u0440\u0430\u0441\u043D\u044B\u043C\u0438.",
        en: "Feb\u2013Apr \u2014 Kornilov\u2019s Ice March. 13 Apr \u2014 Kornilov killed near Yekaterinodar. December \u2014 Rostov taken by the Reds."
      },
      1919: {
        ru: "\u0406\u044E\u043D\u044C \u2014 \u0412\u0421\u042E\u0420 \u0431\u0435\u0440\u0435\u0442\u044A \u0426\u0430\u0440\u0438\u0446\u044B\u043D\u044A \u0438 \u0425\u0430\u0440\u044C\u043A\u043E\u0432\u044A. \u041E\u0441\u0435\u043D\u044C\u044E \u2014 \xAB\u041C\u043E\u0441\u043A\u043E\u0432\u0441\u043A\u0430\u044F \u0434\u0438\u0440\u0435\u043A\u0442\u0438\u0432\u0430\xBB: \u041E\u0440\u0451\u043B\u044A, \u0412\u043E\u0440\u043E\u043D\u0435\u0436\u044A. \u0414\u0435\u043A\u0430\u0431\u0440\u044C \u2014 \u043E\u0442\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0456\u0435 \u043D\u0430 \u041D\u043E\u0432\u043E\u0440\u043E\u0441\u0441\u0456\u0439\u0441\u043A\u044A.",
        en: "Jun \u2014 AFSR takes Tsaritsyn and Kharkov. Autumn \u2014 the Moscow Directive: Orel, Voronezh. December \u2014 retreat to Novorossiysk."
      },
      1920: {
        ru: "\u041C\u0430\u0440\u0442\u044A \u2014 \u044D\u0432\u0430\u043A\u0443\u0430\u0446\u0456\u044F \u041D\u043E\u0432\u043E\u0440\u043E\u0441\u0441\u0456\u0439\u0441\u043A\u0430. \u0410\u043F\u0440\u0463\u043B\u044C \u2014 \u0414\u0435\u043D\u0438\u043A\u0438\u043D\u044A \u043F\u0435\u0440\u0435\u0434\u0430\u0451\u0442\u044A \u043A\u043E\u043C\u0430\u043D\u0434\u0443 \u0412\u0440\u0430\u043D\u0433\u0435\u043B\u044E. 7\u201411 \u043D\u043E\u044F\u0431\u0440\u044F \u2014 \u041F\u0435\u0440\u0435\u043A\u043E\u043F\u044A. 14\u201416 \u043D\u043E\u044F\u0431\u0440\u044F \u2014 \u044D\u0432\u0430\u043A\u0443\u0430\u0446\u0456\u044F \u041A\u0440\u044B\u043C\u0430.",
        en: "March \u2014 Novorossiysk evacuation. April \u2014 Denikin hands command to Wrangel. 7\u201311 November \u2014 Perekop. 14\u201316 November \u2014 Crimea evacuated."
      },
      1921: {
        ru: "\u041C\u0430\u0445\u043D\u043E\u0432\u0449\u0438\u043D\u0430 \u0434\u043E\u0436\u0438\u0432\u0430\u0435\u0442\u044A \u0441\u0432\u043E\u0438 \u0434\u043D\u0438. \u0410\u0432\u0433\u0443\u0441\u0442\u044A 1921 \u2014 \u041C\u0430\u0445\u043D\u043E \u0443\u0445\u043E\u0434\u0438\u0442\u044A \u0432\u044A \u0420\u0443\u043C\u044B\u043D\u0456\u044E.",
        en: "The Makhnovist movement lives out its last days. August 1921 \u2014 Makhno flees to Romania."
      },
      1922: {
        ru: "\u0414\u043E\u043D\u044A \u0438 \u041A\u0443\u0431\u0430\u043D\u044C \u2014 \u0433\u043E\u043B\u043E\u0434\u044A, \u0442\u0438\u0444\u044A, \u0432\u043E\u0437\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0456\u0435 \u0436\u0435\u043B\u0463\u0437\u043D\u044B\u0445\u044A \u0434\u043E\u0440\u043E\u0433\u044A. \u041E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0456\u0435 \u0423\u043A\u0440\u0430\u0438\u043D\u0441\u043A\u043E\u0439 \u0421\u0421\u0420 \u0432\u0445\u043E\u0434\u0438\u0442\u044A \u0432\u044A \u0421\u0421\u0421\u0420.",
        en: "The Don and Kuban \u2014 famine, typhus, rebuilding of railways. Ukrainian SSR becomes part of the USSR."
      }
    }
  },
  {
    id: "volga",
    ru: "\u041F\u043E\u0432\u043E\u043B\u0436\u044C\u0435 \xB7 \u0423\u0440\u0430\u043B\u044A",
    en: "Volga \xB7 Urals",
    bbox: { x: 340, y: 330, w: 240, h: 200 },
    evByYear: {
      1918: {
        ru: "\u041C\u0430\u0435\u043C\u044A \u2014 \u043C\u044F\u0442\u0435\u0436\u044A \u0427\u0435\u0445\u043E\u0441\u043B\u043E\u0432\u0430\u0446\u043A\u0430\u0433\u043E \u043A\u043E\u0440\u043F\u0443\u0441\u0430 \u0432\u0434\u043E\u043B\u044C \u0422\u0440\u0430\u043D\u0441\u0441\u0438\u0431\u0430. \u041A\u043E\u043C\u0443\u0447\u044A \u0432\u044A \u0421\u0430\u043C\u0430\u0440\u0463. \u0406\u044E\u043B\u044C \u2014 \u0420\u043E\u043C\u0430\u043D\u043E\u0432\u044B \u0440\u0430\u0437\u0441\u0442\u0440\u0463\u043B\u044F\u043D\u044B \u0432\u044A \u0415\u043A\u0430\u0442\u0435\u0440\u0438\u043D\u0431\u0443\u0440\u0433\u0463.",
        en: "May \u2014 Czechoslovak Legion revolt along the Trans-Siberian. Komuch in Samara. July \u2014 Romanovs shot in Yekaterinburg."
      },
      1919: {
        ru: "\u0412\u0435\u0441\u0435\u043D\u0435\u0435 \u043D\u0430\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0456\u0435 \u041A\u043E\u043B\u0447\u0430\u043A\u0430 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u043F\u043E\u0434\u044A \u0421\u0430\u043C\u0430\u0440\u043E\u0439 (\u0424\u0440\u0443\u043D\u0437\u0435, \u0411\u0443\u0433\u0443\u0440\u0443\u0441\u043B\u0430\u043D\u044A). \u0406\u044E\u043B\u044C \u2014 \u0423\u0444\u0430 \u0438 \u0417\u043B\u0430\u0442\u043E\u0443\u0441\u0442\u044A \u0443 \u043A\u0440\u0430\u0441\u043D\u044B\u0445\u044A.",
        en: "Kolchak\u2019s spring offensive stopped near Samara (Frunze, Buguruslan). July \u2014 Ufa and Zlatoust taken by the Reds."
      },
      1920: {
        ru: "\u0422\u044B\u043B\u044A. \u0421\u0442\u0440\u043E\u0438\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E \u0412\u043E\u043B\u0433\u043E-\u041A\u0430\u043C\u0441\u043A\u043E\u0439 \u0432\u043E\u0435\u043D\u043D\u043E\u0439 \u0444\u043B\u043E\u0442\u0438\u043B\u0456\u0438, \u043C\u043E\u0431\u0438\u043B\u0438\u0437\u0430\u0446\u0456\u044F \u043F\u0440\u043E\u0434\u0440\u0430\u0437\u0432\u0451\u0440\u0441\u0442\u043A\u0438.",
        en: "The rear. Construction of the Volga-Kama military flotilla; grain requisitioning ramps up."
      },
      1921: {
        ru: "\u041A\u0430\u0442\u0430\u0441\u0442\u0440\u043E\u0444\u0438\u0447\u0435\u0441\u043A\u0456\u0439 \u0433\u043E\u043B\u043E\u0434\u044A \u0432\u044A \u041F\u043E\u0432\u043E\u043B\u0436\u044C\u0463 \u2014 \u0434\u043E 5 \u043C\u0438\u043B\u043B\u0456\u043E\u043D\u043E\u0432\u044A \u043F\u043E\u0433\u0438\u0431\u0448\u0438\u0445\u044A. \u041F\u043E\u043C\u0433\u043E\u043B\u044Cd, \u0410\u0420\u0410, \u0424. \u041D\u0430\u043D\u0441\u0435\u043D\u044A. \u0422\u0430\u043C\u0431\u043E\u0432\u044A \u2014 \u0433\u0430\u0437\u044B.",
        en: "Catastrophic famine on the Volga \u2014 up to 5 million dead. Pomgol, ARA, Fridtjof Nansen. Tambov \u2014 poison gas."
      },
      1922: {
        ru: "\u0413\u043E\u043B\u043E\u0434\u044A \u043E\u0442\u0441\u0442\u0443\u043F\u0430\u0435\u0442\u044A \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0441\u0435\u043D\u044C\u044E. \u041A\u043E\u043D\u0444\u0438\u0441\u043A\u0430\u0446\u0456\u044F \u0446\u0435\u0440\u043A\u043E\u0432\u043D\u044B\u0445\u044A \u0446\u0463\u043D\u043D\u043E\u0441\u0442\u0435\u0439 \u043F\u043E\u0434\u044A \u043B\u043E\u0437\u0443\u043D\u0433\u043E\u043C\u044A \u043F\u043E\u043C\u043E\u0449\u0438 \u0433\u043E\u043B\u043E\u0434\u0430\u044E\u0449\u0438\u043C\u044A.",
        en: "Famine recedes only in autumn. Confiscation of church valuables under the banner of famine relief."
      }
    }
  },
  {
    id: "siberia",
    ru: "\u0421\u0438\u0431\u0438\u0440\u044C",
    en: "Siberia",
    bbox: { x: 580, y: 310, w: 320, h: 200 },
    evByYear: {
      1918: {
        ru: "\u041C\u0430\u0435\u043C\u044A \u2014 \u0447\u0435\u0445\u0438 \u0437\u0430\u0445\u0432\u0430\u0442\u044B\u0432\u0430\u044E\u0442\u044A \u0418\u0440\u043A\u0443\u0442\u0441\u043A\u044A, \u041E\u043C\u0441\u043A\u044A, \u041D\u043E\u0432\u043E\u043D\u0438\u043A\u043E\u043B\u0430\u0435\u0432\u0441\u043A\u044A. 18 \u043D\u043E\u044F\u0431\u0440\u044F \u2014 \u043F\u0435\u0440\u0435\u0432\u043E\u0440\u043E\u0442\u044A \u041A\u043E\u043B\u0447\u0430\u043A\u0430 \u0432\u044A \u041E\u043C\u0441\u043A\u0463.",
        en: "May \u2014 the Czechs seize Irkutsk, Omsk, Novonikolaevsk. 18 November \u2014 Kolchak\u2019s coup in Omsk."
      },
      1919: {
        ru: "\u041E\u0441\u0435\u043D\u044C\u044E \u2014 \u043A\u0440\u0430\u0445\u044A \u043A\u043E\u043B\u0447\u0430\u043A\u043E\u0432\u0441\u043A\u0430\u0433\u043E \u0444\u0440\u043E\u043D\u0442\u0430. \u041D\u043E\u044F\u0431\u0440\u044C \u2014 \u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u044A \u041E\u043C\u0441\u043A\u044A, \xAB\u043B\u0435\u0434\u044F\u043D\u043E\u0439 \u043F\u043E\u0445\u043E\u0434\u044A\xBB \u043A\u043E\u043B\u0447\u0430\u043A\u043E\u0432\u0446\u0435\u0432\u044A \u043D\u0430 \u0432\u043E\u0441\u0442\u043E\u043A\u044A.",
        en: "Autumn \u2014 the Kolchak front collapses. November \u2014 Omsk abandoned; Kolchak\u2019s \u201CIce March\u201D eastward."
      },
      1920: {
        ru: "\u042F\u043D\u0432\u0430\u0440\u044C \u2014 \u0447\u0435\u0445\u0438 \u0432\u044B\u0434\u0430\u044E\u0442\u044A \u041A\u043E\u043B\u0447\u0430\u043A\u0430 \u0438\u0440\u043A\u0443\u0442\u0441\u043A\u043E\u043C\u0443 \u041F\u043E\u043B\u0438\u0442\u0446\u0435\u043D\u0442\u0440\u0443. 7 \u0444\u0435\u0432\u0440\u0430\u043B\u044F \u2014 \u0440\u0430\u0437\u0441\u0442\u0440\u0463\u043B\u044A \u041A\u043E\u043B\u0447\u0430\u043A\u0430 \u0432\u044A \u0418\u0440\u043A\u0443\u0442\u0441\u043A\u0463.",
        en: "January \u2014 the Czechs hand Kolchak to the Irkutsk Political Centre. 7 February \u2014 Kolchak shot in Irkutsk."
      },
      1921: {
        ru: "\u0412\u043E\u0437\u0441\u0442\u0430\u043D\u0456\u044F \u0432\u044A \u0417\u0430\u043F\u0430\u0434\u043D\u043E\u0439 \u0421\u0438\u0431\u0438\u0440\u0438 \u043F\u0440\u043E\u0442\u0438\u0432\u044A \u043F\u0440\u043E\u0434\u0440\u0430\u0437\u0432\u0451\u0440\u0441\u0442\u043A\u0438 \u2014 \u043A\u0440\u0443\u043F\u043D\u0463\u0439\u0448\u0456\u044F \u0432\u044A \u0438\u0441\u0442\u043E\u0440\u0456\u0438 \u0420\u0421\u0424\u0421\u0420.",
        en: "Uprisings across Western Siberia against grain requisitioning \u2014 the largest in RSFSR history."
      },
      1922: {
        ru: "\u041B\u0438\u043A\u0432\u0438\u0434\u0430\u0446\u0456\u044F \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u0432\u044A \u0431\u0463\u043B\u044B\u0445\u044A \u0433\u0440\u0443\u043F\u043F\u044A. \u0421\u0438\u0431\u0438\u0440\u044C \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442\u0441\u044F \u0432\u044A \u0445\u043E\u0437\u044F\u0439\u0441\u0442\u0432\u0435\u043D\u043D\u0443\u044E \u0436\u0438\u0437\u043D\u044C \u0420\u0421\u0424\u0421\u0420.",
        en: "Mop-up of remaining White detachments. Siberia re-integrates into RSFSR economic life."
      }
    }
  },
  {
    id: "fareast",
    ru: "\u0414\u0430\u043B\u044C\u043D\u0456\u0439 \u0412\u043E\u0441\u0442\u043E\u043A\u044A",
    en: "Far East",
    bbox: { x: 860, y: 340, w: 220, h: 230 },
    evByYear: {
      1918: {
        ru: "\u0410\u043F\u0440\u0463\u043B\u044C \u2014 \u044F\u043F\u043E\u043D\u0446\u044B \u0432\u044B\u0441\u0430\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0432\u043E \u0412\u043B\u0430\u0434\u0438\u0432\u043E\u0441\u0442\u043E\u043A\u0463. \u0410\u0442\u0430\u043C\u0430\u043D\u044A \u0421\u0435\u043C\u0451\u043D\u043E\u0432\u044A \u0432\u044A \u0427\u0438\u0442\u0463. \u042F\u043F\u043E\u043D\u0441\u043A\u0430\u044F \u0438\u043D\u0442\u0435\u0440\u0432\u0435\u043D\u0446\u0456\u044F \u0440\u0430\u0441\u0442\u044F\u043D\u0435\u0442\u0441\u044F \u0434\u043E 1922.",
        en: "April \u2014 Japanese land at Vladivostok. Ataman Semyonov in Chita. Japanese intervention will drag on until 1922."
      },
      1919: {
        ru: "\u0412\u043B\u0430\u0434\u0438\u0432\u043E\u0441\u0442\u043E\u043A\u044A \u2014 \u0442\u044B\u043B\u044A \u041A\u043E\u043B\u0447\u0430\u043A\u0430, \u0433\u043B\u0430\u0432\u043D\u044B\u0439 \u043A\u0430\u043D\u0430\u043B\u044A \u0441\u043D\u0430\u0431\u0436\u0435\u043D\u0456\u044F \u043E\u0442\u044A \u0410\u043D\u0442\u0430\u043D\u0442\u044B \u043F\u043E \u0422\u0440\u0430\u043D\u0441\u0441\u0438\u0431\u0443.",
        en: "Vladivostok \u2014 Kolchak\u2019s rear; the main Entente supply channel via the Trans-Siberian."
      },
      1920: {
        ru: "\u0410\u043F\u0440\u0463\u043B\u044C \u2014 \u0414\u0430\u043B\u044C\u043D\u0435-\u0412\u043E\u0441\u0442\u043E\u0447\u043D\u0430\u044F \u0420\u0435\u0441\u043F\u0443\u0431\u043B\u0438\u043A\u0430 \u043A\u0430\u043A\u044A \u0431\u0443\u0444\u0435\u0440\u044A \u043C\u0435\u0436\u0434\u0443 \u0420\u0421\u0424\u0421\u0420 \u0438 \u042F\u043F\u043E\u043D\u0456\u0435\u0439. \u0421\u0442\u043E\u043B\u0438\u0446\u0430 \u2014 \u0412\u0435\u0440\u0445\u043D\u0435\u0443\u0434\u0438\u043D\u0441\u043A\u044A, \u0437\u0430\u0442\u0463\u043C\u044A \u0427\u0438\u0442\u0430.",
        en: "April \u2014 the Far Eastern Republic is created as a buffer between the RSFSR and Japan. Capital in Verkhneudinsk, then Chita."
      },
      1921: {
        ru: "\u041C\u0430\u0435\u043C\u044A \u2014 \u0431\u0463\u043B\u044B\u0439 \u043F\u0435\u0440\u0435\u0432\u043E\u0440\u043E\u0442\u044A \u0432\u043E \u0412\u043B\u0430\u0434\u0438\u0432\u043E\u0441\u0442\u043E\u043A\u0463 (\u0431\u0440\u0430\u0442\u044C\u044F \u041C\u0435\u0440\u043A\u0443\u043B\u043E\u0432\u044B). \u041D\u0430\u0440\u043E\u0434\u043D\u043E-\u0440\u0435\u0432. \u0430\u0440\u043C\u0456\u044F \u0414\u0412\u0420 \u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044A \u043E\u0442\u0432\u0463\u0442\u043D\u044B\u0439 \u0443\u0434\u0430\u0440\u044A.",
        en: "May \u2014 White coup in Vladivostok (the Merkulov brothers). The FER People\u2019s Revolutionary Army prepares its counter."
      },
      1922: {
        ru: "\u0424\u0435\u0432\u0440\u0430\u043B\u044C \u2014 \u0412\u043E\u043B\u043E\u0447\u0430\u0435\u0432\u043A\u0430. \u041E\u043A\u0442\u044F\u0431\u0440\u044C \u2014 \u0421\u043F\u043E\u0441\u0441\u0441\u043A, \u0425\u0430\u0431\u0430\u0440\u043E\u0432\u0441\u043A\u044A, \u0412\u043B\u0430\u0434\u0438\u0432\u043E\u0441\u0442\u043E\u043A\u044A \u0432\u0437\u044F\u0442\u044B \u041D\u0420\u0410. 15 \u043D\u043E\u044F\u0431\u0440\u044F \u2014 \u0414\u0412\u0420 \u0432\u043E\u0448\u043B\u0430 \u0432\u044A \u0420\u0421\u0424\u0421\u0420.",
        en: "February \u2014 Volochayevka. October \u2014 Spassk, Khabarovsk, Vladivostok taken by the PRA. 15 November \u2014 FER joins the RSFSR."
      }
    }
  }
];
function DeskMap({ year, x, y, width = 1100, rotate = -3 }) {
  const height = width * 0.62;
  const [region, setRegion] = React.useState(null);
  React.useEffect(() => {
    if (!region) return;
    const onKey = (e) => {
      if (e.key === "Escape") setRegion(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [region]);
  const vbW = 1100, vbH = 680;
  let transform = "translate(0,0) scale(1)";
  if (region) {
    const r = MAP_REGIONS.find((rr) => rr.id === region);
    if (r) {
      const pad = 30;
      const bw = r.bbox.w + pad * 2;
      const bh = r.bbox.h + pad * 2;
      const scale = Math.min(vbW / bw, vbH / bh);
      const tx = -((r.bbox.x - pad) * scale) + (vbW - bw * scale) / 2;
      const ty = -((r.bbox.y - pad) * scale) + (vbH - bh * scale) / 2;
      transform = `translate(${tx}px,${ty}px) scale(${scale})`;
    }
  }
  const activeRegion = region ? MAP_REGIONS.find((r) => r.id === region) : null;
  const ev = activeRegion && activeRegion.evByYear[year.year] ? activeRegion.evByYear[year.year][year.lang || "ru"] : null;
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: x,
    top: y,
    width,
    height,
    transform: `rotate(${rotate}deg)`,
    transformOrigin: "center",
    boxShadow: "0 14px 30px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.3)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    ...paperBg({ base: "#e0cea3", vignette: false }),
    border: `1px solid ${t.paperDark}`
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: [
      "linear-gradient(90deg, transparent 32.5%, rgba(40,20,0,.18) 33%, transparent 33.5%)",
      "linear-gradient(90deg, transparent 65.5%, rgba(40,20,0,.18) 66%, transparent 66.5%)",
      "linear-gradient(180deg, transparent 48.5%, rgba(40,20,0,.18) 49%, transparent 49.5%)"
    ].join(",")
  } }), /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: "0 0 1100 680",
      style: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        cursor: region ? "zoom-out" : "default"
      },
      onClick: (e) => {
        if (region && e.target === e.currentTarget) setRegion(null);
      }
    },
    /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("pattern", { id: "seaHatch", width: "6", height: "6", patternUnits: "userSpaceOnUse", patternTransform: "rotate(30)" }, /* @__PURE__ */ React.createElement("line", { x1: "0", y1: "0", x2: "0", y2: "6", stroke: "#6a8aa6", strokeWidth: "0.5", opacity: "0.35" }))),
    /* @__PURE__ */ React.createElement("rect", { width: "1100", height: "680", fill: "url(#seaHatch)", opacity: "0.7" }),
    /* @__PURE__ */ React.createElement("g", { style: {
      transform,
      transformOrigin: "0 0",
      transition: "transform 700ms cubic-bezier(.4,.15,.2,1)"
    } }, /* @__PURE__ */ React.createElement("text", { x: "120", y: "95", fontSize: "13", fontFamily: f.display, fontStyle: "italic", fill: "#4a6a8a", opacity: "0.7" }, year.lang === "ru" ? "\u0421\u0463\u0432\u0435\u0440\u043D\u044B\u0439 \u041B\u0435\u0434\u043E\u0432\u0438\u0442\u044B\u0439 \u043E\u043A\u0435\u0430\u043D\u044A" : "Arctic Ocean"), /* @__PURE__ */ React.createElement("text", { x: "60", y: "420", fontSize: "11", fontFamily: f.display, fontStyle: "italic", fill: "#4a6a8a", opacity: "0.65" }, year.lang === "ru" ? "\u0411\u0430\u043B\u0442." : "Baltic"), /* @__PURE__ */ React.createElement("text", { x: "210", y: "550", fontSize: "11", fontFamily: f.display, fontStyle: "italic", fill: "#4a6a8a", opacity: "0.65" }, year.lang === "ru" ? "\u0427\u0451\u0440\u043D\u043E\u0435 \u043C." : "Black Sea"), /* @__PURE__ */ React.createElement("text", { x: "440", y: "560", fontSize: "11", fontFamily: f.display, fontStyle: "italic", fill: "#4a6a8a", opacity: "0.65" }, year.lang === "ru" ? "\u041A\u0430\u0441\u043F\u0456\u0439" : "Caspian"), /* @__PURE__ */ React.createElement("text", { x: "1000", y: "480", fontSize: "11", fontFamily: f.display, fontStyle: "italic", fill: "#4a6a8a", opacity: "0.65" }, year.lang === "ru" ? "\u0422\u0438\u0445. \u043E\u043A." : "Pacific"), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "\n            M 80 320\n            Q 60 280 90 250\n            L 140 235\n            Q 175 220 185 190\n            L 220 170\n            Q 260 155 290 175\n            L 330 200\n            Q 370 195 400 175\n            Q 425 150 470 145\n            L 520 160\n            Q 560 150 600 155\n            Q 650 140 700 150\n            Q 760 145 810 165\n            Q 870 160 920 180\n            Q 970 195 1000 180\n            L 1035 155\n            Q 1055 170 1050 210\n            L 1030 255\n            Q 1045 290 1025 320\n            L 1030 355\n            Q 1055 395 1030 425\n            L 990 440\n            Q 975 465 990 490\n            Q 1010 510 990 530\n            Q 960 540 925 525\n            Q 890 515 870 490\n            L 840 470\n            Q 815 475 800 460\n            Q 775 445 755 430\n            L 730 420\n            Q 705 430 690 445\n            L 665 450\n            Q 635 440 610 450\n            L 580 455\n            Q 550 445 530 455\n            L 505 475\n            Q 485 488 460 482\n            L 440 495\n            Q 420 505 415 490\n            L 410 470\n            Q 400 465 395 480\n            Q 385 505 360 508\n            L 335 500\n            Q 310 510 292 500\n            L 278 515\n            Q 260 540 235 540\n            Q 215 535 205 515\n            L 190 500\n            Q 170 490 160 470\n            L 145 445\n            Q 130 435 125 415\n            L 115 390\n            Q 100 380 95 358\n            L 80 320 Z\n          ",
        fill: "#eccf92",
        stroke: "#5a3a1a",
        strokeWidth: "2",
        strokeLinejoin: "round"
      }
    ), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 155 235 Q 165 215 180 225 Q 175 245 160 245 Z",
        fill: "#eccf92",
        stroke: "#5a3a1a",
        strokeWidth: "1.4"
      }
    ), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 1010 430 Q 1040 445 1050 490 Q 1045 540 1025 555 Q 1015 520 1010 480 Z",
        fill: "#eccf92",
        stroke: "#5a3a1a",
        strokeWidth: "1.4"
      }
    ), /* @__PURE__ */ React.createElement("ellipse", { cx: "985", cy: "470", rx: "5", ry: "24", fill: "#eccf92", stroke: "#5a3a1a", strokeWidth: "1" }), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 205 470 Q 240 475 280 470 Q 310 475 330 485 Q 340 495 325 505 Q 290 515 255 510 Q 220 505 205 490 Z",
        fill: "url(#seaHatch)",
        stroke: "#5a3a1a",
        strokeWidth: "1.2"
      }
    ), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 435 475 Q 455 478 465 500 Q 470 530 458 555 Q 445 570 430 555 Q 420 525 425 500 Z",
        fill: "url(#seaHatch)",
        stroke: "#5a3a1a",
        strokeWidth: "1.2"
      }
    ), /* @__PURE__ */ React.createElement("ellipse", { cx: "530", cy: "510", rx: "14", ry: "9", fill: "url(#seaHatch)", stroke: "#5a3a1a", strokeWidth: "0.8" }), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 800 340 Q 820 360 830 400 Q 825 420 815 405 Q 800 370 800 340 Z",
        fill: "url(#seaHatch)",
        stroke: "#5a3a1a",
        strokeWidth: "0.8"
      }
    ), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 120 290 Q 135 310 145 340 Q 140 360 125 355 Q 115 330 118 300 Z",
        fill: "url(#seaHatch)",
        stroke: "#5a3a1a",
        strokeWidth: "1"
      }
    ), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 580 220 Q 590 300 595 390 Q 600 470 605 520",
        stroke: "#8a6a3c",
        strokeWidth: "2.5",
        fill: "none",
        strokeDasharray: "2 4",
        opacity: "0.7"
      }
    ), /* @__PURE__ */ React.createElement("text", { x: "610", y: "260", fontSize: "10", fontFamily: f.display, fontStyle: "italic", fill: "#6a4a20", opacity: "0.8" }, year.lang === "ru" ? "\u0423\u0440\u0430\u043B\u044A" : "Urals"), /* @__PURE__ */ React.createElement("path", { d: "M 180 320 Q 200 400 220 470", stroke: "#5a7a9a", strokeWidth: "1.8", fill: "none", opacity: "0.75" }), /* @__PURE__ */ React.createElement("path", { d: "M 340 250 Q 360 350 390 450 Q 410 475 430 478", stroke: "#5a7a9a", strokeWidth: "2", fill: "none", opacity: "0.8" }), /* @__PURE__ */ React.createElement("text", { x: "345", y: "355", fontSize: "10", fontFamily: f.display, fontStyle: "italic", fill: "#4a6a8a", opacity: "0.75" }, year.lang === "ru" ? "\u0412\u043E\u043B\u0433\u0430" : "Volga"), /* @__PURE__ */ React.createElement("path", { d: "M 690 230 Q 700 310 715 390 Q 725 460 730 500", stroke: "#5a7a9a", strokeWidth: "1.8", fill: "none", opacity: "0.7" }), /* @__PURE__ */ React.createElement("path", { d: "M 860 240 Q 870 320 880 400", stroke: "#5a7a9a", strokeWidth: "1.6", fill: "none", opacity: "0.6" }), [
      { x: 135, y: 320, name: year.lang === "ru" ? "\u041F\u0435\u0442\u0440\u043E\u0433\u0440\u0430\u0434\u044A" : "Petrograd", big: true },
      { x: 205, y: 375, name: year.lang === "ru" ? "\u041C\u043E\u0441\u043A\u0432\u0430" : "Moscow", big: true, cap: true },
      { x: 150, y: 255, name: year.lang === "ru" ? "\u041C\u0443\u0440\u043C\u0430\u043D\u0441\u043A\u044A" : "Murmansk" },
      { x: 340, y: 460, name: year.lang === "ru" ? "\u0426\u0430\u0440\u0438\u0446\u044B\u043D\u044A" : "Tsaritsyn" },
      { x: 380, y: 420, name: year.lang === "ru" ? "\u0421\u0430\u043C\u0430\u0440\u0430" : "Samara" },
      { x: 540, y: 370, name: year.lang === "ru" ? "\u0423\u0444\u0430" : "Ufa" },
      { x: 660, y: 380, name: year.lang === "ru" ? "\u041E\u043C\u0441\u043A\u044A" : "Omsk" },
      { x: 725, y: 395, name: year.lang === "ru" ? "\u041D\u043E\u0432\u043E\u043D\u0438\u043A\u043E\u043B\u0430\u0435\u0432\u0441\u043A\u044A" : "Novonikolaevsk" },
      { x: 830, y: 380, name: year.lang === "ru" ? "\u0418\u0440\u043A\u0443\u0442\u0441\u043A\u044A" : "Irkutsk" },
      { x: 270, y: 450, name: year.lang === "ru" ? "\u0420\u043E\u0441\u0442\u043E\u0432\u044A" : "Rostov" },
      { x: 170, y: 440, name: year.lang === "ru" ? "\u041A\u0456\u0435\u0432\u044A" : "Kiev" },
      { x: 280, y: 505, name: year.lang === "ru" ? "\u0415\u043A\u0430\u0442\u0435\u0440\u0438\u043D\u043E\u0434\u0430\u0440\u044A" : "Ekaterinodar" },
      { x: 320, y: 395, name: year.lang === "ru" ? "\u041E\u0440\u0451\u043B\u044A" : "Orel" },
      { x: 435, y: 400, name: year.lang === "ru" ? "\u0415\u043A\u0430\u0442\u0435\u0440\u0438\u043D\u0431\u0443\u0440\u0433\u044A" : "Yekaterinburg" },
      { x: 1e3, y: 480, name: year.lang === "ru" ? "\u0412\u043B\u0430\u0434\u0438\u0432\u043E\u0441\u0442\u043E\u043A\u044A" : "Vladivostok" }
    ].map((c, i) => /* @__PURE__ */ React.createElement("g", { key: i }, c.cap && /* @__PURE__ */ React.createElement("circle", { cx: c.x, cy: c.y, r: "10", fill: "none", stroke: t.redDeep, strokeWidth: "1.5", opacity: "0.65" }), /* @__PURE__ */ React.createElement("circle", { cx: c.x, cy: c.y, r: c.big ? 5 : 3.2, fill: "#3a1010", stroke: "#6a2020", strokeWidth: "1" }), /* @__PURE__ */ React.createElement(
      "text",
      {
        x: c.x + 8,
        y: c.y + 4,
        fontSize: c.big ? 13 : 11,
        fontFamily: f.mono,
        fontWeight: c.big ? 700 : 400,
        fill: "#2a1408"
      },
      c.name
    ))), year.year === 1918 && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 570 220 Q 580 320 590 420 Q 600 490 580 530",
        stroke: t.red,
        strokeWidth: "4",
        fill: "none",
        strokeDasharray: "10 5",
        opacity: "0.9"
      }
    ), /* @__PURE__ */ React.createElement("text", { x: "555", y: "250", fontSize: "15", fontFamily: f.display, fill: t.red, fontStyle: "italic", transform: "rotate(92 555 250)" }, year.lang === "ru" ? "\u0412\u043E\u0441\u0442\u043E\u0447\u043D\u044B\u0439 \u0444\u0440\u043E\u043D\u0442\u044A" : "Eastern Front"), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 220 470 Q 260 485 320 490 Q 360 495 400 480",
        stroke: t.red,
        strokeWidth: "3.5",
        fill: "none",
        strokeDasharray: "8 4",
        opacity: "0.8"
      }
    ), /* @__PURE__ */ React.createElement("text", { x: "230", y: "500", fontSize: "12", fontFamily: f.mono, fill: t.red }, year.lang === "ru" ? "\u042E\u0436\u043D\u044B\u0439 \u0444\u0440." : "Southern Fr."), /* @__PURE__ */ React.createElement("circle", { cx: "150", cy: "255", r: "14", fill: "none", stroke: t.red, strokeWidth: "2", opacity: "0.7" }), /* @__PURE__ */ React.createElement("text", { x: "82", y: "240", fontSize: "11", fontFamily: f.mono, fill: t.redDeep }, year.lang === "ru" ? "\u0410\u043D\u0442\u0430\u043D\u0442\u0430" : "Entente")), year.year === 1919 && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 270 505 Q 260 470 250 430 Q 235 400 220 380",
        stroke: t.red,
        strokeWidth: "5",
        fill: "none",
        strokeDasharray: "12 5",
        opacity: "0.95"
      }
    ), /* @__PURE__ */ React.createElement("circle", { cx: "205", cy: "375", r: "16", fill: "none", stroke: t.red, strokeWidth: "2.5", opacity: "0.8" }), /* @__PURE__ */ React.createElement("text", { x: "225", y: "370", fontSize: "13", fontFamily: f.display, fill: t.red, fontStyle: "italic" }, year.lang === "ru" ? "\u041E\u0440\u0451\u043B\u044A \u2014 380 \u0432\u0451\u0440\u0441\u0442\u044A" : "Orel \u2014 380 versts"), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 660 380 Q 610 380 570 370 Q 520 370 480 365",
        stroke: t.red,
        strokeWidth: "4",
        fill: "none",
        strokeDasharray: "8 4",
        opacity: "0.85"
      }
    ), /* @__PURE__ */ React.createElement("text", { x: "570", y: "345", fontSize: "12", fontFamily: f.mono, fill: t.redDeep }, year.lang === "ru" ? "\u2190 \u041A\u043E\u043B\u0447\u0430\u043A\u044A" : "\u2190 Kolchak"), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 85 330 Q 110 322 135 320",
        stroke: t.red,
        strokeWidth: "3.5",
        fill: "none",
        strokeDasharray: "6 3",
        opacity: "0.8"
      }
    ), /* @__PURE__ */ React.createElement("text", { x: "70", y: "345", fontSize: "11", fontFamily: f.mono, fill: t.redDeep }, year.lang === "ru" ? "\u042E\u0434\u0435\u043D\u0438\u0447\u044A \u2192" : "Yudenich \u2192")), year.year === 1920 && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 90 430 Q 130 435 170 440",
        stroke: t.red,
        strokeWidth: "4",
        fill: "none",
        strokeDasharray: "10 4",
        opacity: "0.9"
      }
    ), /* @__PURE__ */ React.createElement("text", { x: "85", y: "455", fontSize: "12", fontFamily: f.mono, fill: t.red }, year.lang === "ru" ? "\u0412\u0430\u0440\u0448\u0430\u0432\u0430" : "Warsaw"), /* @__PURE__ */ React.createElement("text", { x: "155", y: "425", fontSize: "12", fontFamily: f.mono, fill: t.red }, year.lang === "ru" ? "\u041A\u0456\u0435\u0432\u044A" : "Kiev"), /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 260 490 Q 270 505 285 515 Q 295 525 290 540",
        stroke: t.red,
        strokeWidth: "3.5",
        fill: "none",
        opacity: "0.85"
      }
    ), /* @__PURE__ */ React.createElement("circle", { cx: "288", cy: "518", r: "10", fill: t.red, opacity: "0.65" }), /* @__PURE__ */ React.createElement("text", { x: "300", y: "520", fontSize: "13", fontFamily: f.display, fill: t.red, fontStyle: "italic" }, year.lang === "ru" ? "\u041F\u0435\u0440\u0435\u043A\u043E\u043F\u044A \xB7 \u041A\u0440\u044B\u043C\u044A" : "Perekop \xB7 Crimea")), year.year === 1921 && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("circle", { cx: "125", cy: "318", r: "10", fill: "none", stroke: t.red, strokeWidth: "2.5", opacity: "0.9" }), /* @__PURE__ */ React.createElement("text", { x: "75", y: "308", fontSize: "12", fontFamily: f.mono, fill: t.redDeep }, year.lang === "ru" ? "\u041A\u0440\u043E\u043D\u0448\u0442\u0430\u0434\u0442\u044A" : "Kronstadt"), /* @__PURE__ */ React.createElement(
      "ellipse",
      {
        cx: "390",
        cy: "430",
        rx: "46",
        ry: "32",
        fill: t.red,
        fillOpacity: "0.12",
        stroke: t.red,
        strokeWidth: "2",
        strokeDasharray: "3 3",
        opacity: "0.85"
      }
    ), /* @__PURE__ */ React.createElement("text", { x: "355", y: "395", fontSize: "14", fontFamily: f.display, fill: t.red, fontStyle: "italic" }, year.lang === "ru" ? "\u041F\u043E\u0432\u043E\u043B\u0436\u044C\u0435 \xB7 \u0433\u043E\u043B\u043E\u0434\u044A" : "Volga \xB7 famine"), /* @__PURE__ */ React.createElement("circle", { cx: "270", cy: "415", r: "8", fill: t.red, opacity: "0.75" }), /* @__PURE__ */ React.createElement("text", { x: "235", y: "410", fontSize: "11", fontFamily: f.mono, fill: t.redDeep }, year.lang === "ru" ? "\u0422\u0430\u043C\u0431\u043E\u0432\u044A" : "Tambov")), year.year === 1922 && /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement(
      "path",
      {
        d: "M 830 380 Q 890 410 940 440 Q 980 460 1000 480",
        stroke: t.red,
        strokeWidth: "5",
        fill: "none",
        opacity: "0.9"
      }
    ), /* @__PURE__ */ React.createElement("circle", { cx: "1000", cy: "480", r: "12", fill: t.red }), /* @__PURE__ */ React.createElement("text", { x: "895", y: "430", fontSize: "14", fontFamily: f.display, fill: t.red, fontStyle: "italic" }, year.lang === "ru" ? "\u041D\u0430 \u0412\u043B\u0430\u0434\u0438\u0432\u043E\u0441\u0442\u043E\u043A\u044A" : "To Vladivostok"), /* @__PURE__ */ React.createElement(
      "rect",
      {
        x: "100",
        y: "220",
        width: "900",
        height: "320",
        fill: "none",
        stroke: t.redDeep,
        strokeWidth: "1.5",
        strokeDasharray: "4 3",
        opacity: "0.5"
      }
    ), /* @__PURE__ */ React.createElement("text", { x: "550", y: "210", fontSize: "14", fontFamily: f.display, fontStyle: "italic", fill: t.redDeep, textAnchor: "middle" }, year.lang === "ru" ? "30 \u0434\u0435\u043A\u0430\u0431\u0440\u044F 1922 \u2014 \u0421\u0421\u0421\u0420" : "30 Dec 1922 \u2014 USSR")), /* @__PURE__ */ React.createElement("g", { transform: "translate(820, 540)", opacity: region ? 0 : 1, style: { transition: "opacity 300ms" } }, /* @__PURE__ */ React.createElement("rect", { width: "230", height: "90", fill: "#f5e4b5", stroke: "#6a4a20", strokeWidth: "1" }), /* @__PURE__ */ React.createElement("text", { x: "115", y: "20", fontSize: "11", fontFamily: f.display, fontStyle: "italic", textAnchor: "middle", fill: "#3a1c08" }, year.lang === "ru" ? "\u0424\u0440\u043E\u043D\u0442\u044B \u0413\u0440\u0430\u0436\u0434\u0430\u043D\u0441\u043A\u043E\u0439 \u0432\u043E\u0439\u043D\u044B" : "Civil War Fronts"), /* @__PURE__ */ React.createElement("line", { x1: "14", y1: "40", x2: "40", y2: "40", stroke: t.red, strokeWidth: "3", strokeDasharray: "6 3" }), /* @__PURE__ */ React.createElement("text", { x: "48", y: "44", fontSize: "10", fontFamily: f.mono, fill: "#3a1c08" }, year.lang === "ru" ? "\u041A\u0440\u0430\u0441\u043D\u044B\u0439" : "Red"), /* @__PURE__ */ React.createElement("line", { x1: "14", y1: "58", x2: "40", y2: "58", stroke: "#8a6a30", strokeWidth: "2" }), /* @__PURE__ */ React.createElement("text", { x: "48", y: "62", fontSize: "10", fontFamily: f.mono, fill: "#3a1c08" }, year.lang === "ru" ? "\u0413\u0440\u0430\u043D\u0438\u0446\u0430" : "Border"), /* @__PURE__ */ React.createElement("text", { x: "14", y: "80", fontSize: "9", fontFamily: f.mono, fill: "#6a4a20" }, year.year, " \xB7 ", year.lang === "ru" ? "\u0420\u0412\u0421\u0420" : "RVSR"))),
    !region && MAP_REGIONS.map((r) => {
      const cx = r.bbox.x + r.bbox.w / 2;
      const cy = r.bbox.y + r.bbox.h / 2;
      return /* @__PURE__ */ React.createElement(
        "g",
        {
          key: r.id,
          onClick: () => {
            setRegion(r.id);
          },
          style: { cursor: "zoom-in" }
        },
        /* @__PURE__ */ React.createElement(
          "rect",
          {
            x: r.bbox.x,
            y: r.bbox.y,
            width: r.bbox.w,
            height: r.bbox.h,
            fill: "#000",
            fillOpacity: 0,
            stroke: "#3a1c08",
            strokeWidth: 0.8,
            strokeDasharray: "4 4",
            strokeOpacity: 0.18
          }
        ),
        false
      );
    }),
    region && activeRegion && (() => {
      const r = activeRegion;
      return /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement(
        "rect",
        {
          x: 0,
          y: 0,
          width: vbW,
          height: vbH,
          fill: "transparent",
          onClick: () => setRegion(null),
          style: { cursor: "zoom-out" }
        }
      ), /* @__PURE__ */ React.createElement(
        "rect",
        {
          x: 20,
          y: 20,
          width: vbW - 40,
          height: "44",
          fill: "#f0dcae",
          stroke: "#3a1c08",
          strokeWidth: "1.5",
          pointerEvents: "none"
        }
      ), /* @__PURE__ */ React.createElement(
        "text",
        {
          x: 40,
          y: 48,
          fontSize: "20",
          fontFamily: f.display,
          fontStyle: "italic",
          fill: "#3a1c08",
          pointerEvents: "none"
        },
        "\u2315 ",
        r[year.lang || "ru"]
      ), /* @__PURE__ */ React.createElement(
        "text",
        {
          x: vbW - 40,
          y: 48,
          textAnchor: "end",
          fontSize: "13",
          fontFamily: f.mono,
          fill: "#6a4a20",
          letterSpacing: "0.15em",
          pointerEvents: "none"
        },
        year.year
      ));
    })()
  ), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: 30, right: 50 } }, /* @__PURE__ */ React.createElement(Stamp, { text: year.lang === "ru" ? "\u0421\u0415\u041A\u0420\u0415\u0422\u041D\u041E" : "CLASSIFIED", sub: "\u0420\u0412\u0421\u0420", size: 120, rotate: 12, opacity: 0.55 })), region && activeRegion && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setRegion(null),
      style: {
        position: "absolute",
        top: 20,
        left: 20,
        width: 46,
        height: 46,
        borderRadius: "50%",
        background: t.paperLight,
        border: `1.5px solid ${t.inkFaint}`,
        color: t.redDeep,
        fontFamily: f.display,
        fontSize: 22,
        fontStyle: "italic",
        cursor: "pointer",
        boxShadow: "0 6px 16px rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20
      },
      "aria-label": year.lang === "ru" ? "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" : "Close"
    },
    "\xD7"
  ), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    right: 40,
    bottom: 40,
    width: 420,
    background: "#f5e4b5",
    border: `1px solid ${t.paperDark}`,
    padding: "22px 26px 24px",
    boxShadow: "0 16px 40px rgba(0,0,0,.55), 0 3px 8px rgba(0,0,0,.3)",
    transform: "rotate(-1.2deg)",
    zIndex: 18,
    animation: "aDropIn 420ms cubic-bezier(.2,.7,.3,1) both"
  } }, /* @__PURE__ */ React.createElement("style", null, `
              @keyframes aDropIn {
                from { opacity: 0; transform: translateY(-24px) rotate(-1.2deg); }
                to { opacity: 1; transform: translateY(0) rotate(-1.2deg); }
              }
            `), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: f.mono,
    fontSize: 10,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: t.inkFaint
  } }, year.lang === "ru" ? "\u0412\u044B\u043F\u0438\u0441\u043A\u0430 \xB7 \u0420\u0412\u0421\u0420" : "Excerpt \xB7 Revvoensovet"), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 26,
    fontFamily: f.display,
    fontStyle: "italic",
    color: t.redDeep,
    lineHeight: 1.1,
    marginTop: 4,
    letterSpacing: "-0.01em"
  } }, activeRegion[year.lang || "ru"]), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 10,
    height: 1,
    background: `repeating-linear-gradient(90deg, ${t.inkFaint} 0 4px, transparent 4px 8px)`,
    opacity: 0.6
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 15,
    fontFamily: f.body,
    lineHeight: 1.5,
    color: t.ink,
    marginTop: 12,
    fontStyle: "italic",
    textWrap: "pretty"
  } }, ev || (year.lang === "ru" ? "\u2014 \u0441\u043E\u0431\u044B\u0442\u0456\u0439 \u0437\u0430 \u0441\u0435\u0439 \u0433\u043E\u0434\u044A \u043D\u0435 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043E \u0432\u044A \u0441\u0432\u043E\u0434\u043A\u0463. \u2014" : "\u2014 no events logged for this year. \u2014")), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 14,
    fontFamily: f.mono,
    fontSize: 10,
    color: t.inkFaint,
    letterSpacing: "0.12em",
    display: "flex",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("span", null, year.year), /* @__PURE__ */ React.createElement("span", null, year.lang === "ru" ? "\u043B. \u043E\u0431\u043E\u0440\u043E\u0442." : "verso")))), !region && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 30,
    top: 20,
    fontFamily: f.mono,
    fontSize: 11,
    letterSpacing: "0.2em",
    color: t.inkFaint,
    textTransform: "uppercase",
    background: "rgba(245,228,181,.85)",
    padding: "6px 12px",
    border: `1px solid ${t.paperDark}`,
    boxShadow: "0 3px 10px rgba(0,0,0,.25)",
    pointerEvents: "none",
    zIndex: 5
  } }, year.lang === "ru" ? "\u2315 \u043A\u043B\u0438\u043A\u043D\u0438\u0442\u0435 \u043F\u043E \u0440\u0435\u0433\u0438\u043E\u043D\u0443" : "\u2315 click a region"));
}
function Compass({ x, y, size = 180, rotation = 0 }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle at 35% 30%, #e8d090 0%, #c8a060 55%, #7a5020 100%)`,
    boxShadow: "0 12px 30px rgba(0,0,0,.6), inset 0 2px 6px rgba(255,220,160,.6), inset 0 -4px 8px rgba(40,20,0,.8)",
    border: `3px solid ${t.brass}`
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 12,
    borderRadius: "50%",
    background: `radial-gradient(ellipse at 30% 25%, rgba(255,255,255,.55) 0%, transparent 45%), ${t.paperLight}`,
    boxShadow: "inset 0 2px 8px rgba(80,60,20,.4)"
  } }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 160 160", style: { position: "absolute", inset: 0, width: "100%", height: "100%" } }, Array.from({ length: 72 }, (_, i) => {
    const angle = i * 5;
    const major = i % 9 === 0;
    const r1 = 68, r2 = major ? 58 : 63;
    const x1 = 80 + r1 * Math.cos(angle * Math.PI / 180 - Math.PI / 2);
    const y1 = 80 + r1 * Math.sin(angle * Math.PI / 180 - Math.PI / 2);
    const x2 = 80 + r2 * Math.cos(angle * Math.PI / 180 - Math.PI / 2);
    const y2 = 80 + r2 * Math.sin(angle * Math.PI / 180 - Math.PI / 2);
    return /* @__PURE__ */ React.createElement("line", { key: i, x1, y1, x2, y2, stroke: "#3a1c08", strokeWidth: major ? 1.5 : 0.7 });
  }), [
    { a: 0, l: "\u0421", color: t.redDeep },
    { a: 90, l: "\u0412" },
    { a: 180, l: "\u042E" },
    { a: 270, l: "\u0417" }
  ].map((c, i) => {
    const x2 = 80 + 50 * Math.cos(c.a * Math.PI / 180 - Math.PI / 2);
    const y2 = 80 + 50 * Math.sin(c.a * Math.PI / 180 - Math.PI / 2);
    return /* @__PURE__ */ React.createElement(
      "text",
      {
        key: i,
        x: x2,
        y: y2 + 5,
        textAnchor: "middle",
        fontSize: "14",
        fontFamily: f.display,
        fontWeight: "700",
        fill: c.color || "#3a1c08"
      },
      c.l
    );
  }), /* @__PURE__ */ React.createElement("g", { transform: `rotate(${rotation} 80 80)` }, /* @__PURE__ */ React.createElement("path", { d: "M 80 20 L 86 80 L 80 140 L 74 80 Z", fill: t.redDeep, stroke: "#2a1010", strokeWidth: "0.5" }), /* @__PURE__ */ React.createElement("path", { d: "M 20 80 L 80 74 L 140 80 L 80 86 Z", fill: "#d9c398", stroke: "#5a4020", strokeWidth: "0.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "80", cy: "80", r: "4", fill: t.brass, stroke: "#2a1010" })))));
}
function PocketWatch({ x, y, size = 150, minutes = 0 }) {
  const hourAngle = minutes / 60 * 30 % 360;
  const minAngle = minutes * 6 % 360;
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: x,
    top: y,
    width: size,
    height: size * 1.15
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: 22,
    height: 26,
    borderRadius: "50%",
    background: `linear-gradient(180deg, ${t.gold} 0%, ${t.brass} 100%)`,
    border: `1px solid #3a2010`,
    boxShadow: "0 2px 4px rgba(0,0,0,.5)"
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 16,
    left: 0,
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle at 30% 25%, #e8c878, ${t.brass} 60%, #3a2010 100%)`,
    boxShadow: "0 12px 28px rgba(0,0,0,.6), inset 0 3px 8px rgba(255,220,160,.4), inset 0 -4px 10px rgba(0,0,0,.6)",
    border: `3px solid ${t.brass}`
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 14,
    borderRadius: "50%",
    background: `radial-gradient(ellipse at 40% 30%, #f4e8cf 0%, #d9c398 100%)`,
    boxShadow: "inset 0 2px 10px rgba(80,50,20,.4)"
  } }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 140 140", style: { width: "100%", height: "100%" } }, ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"].map((num, i) => {
    const a = i * 30 - 90;
    const r = 56;
    const x2 = 70 + r * Math.cos(a * Math.PI / 180);
    const y2 = 70 + r * Math.sin(a * Math.PI / 180);
    return /* @__PURE__ */ React.createElement("text", { key: i, x: x2, y: y2 + 4, textAnchor: "middle", fontSize: "11", fontFamily: f.display, fontWeight: "700", fill: "#3a1c08" }, num);
  }), /* @__PURE__ */ React.createElement(
    "line",
    {
      x1: "70",
      y1: "70",
      x2: 70 + 30 * Math.cos((hourAngle - 90) * Math.PI / 180),
      y2: 70 + 30 * Math.sin((hourAngle - 90) * Math.PI / 180),
      stroke: "#2a1010",
      strokeWidth: "3.5",
      strokeLinecap: "round"
    }
  ), /* @__PURE__ */ React.createElement(
    "line",
    {
      x1: "70",
      y1: "70",
      x2: 70 + 48 * Math.cos((minAngle - 90) * Math.PI / 180),
      y2: 70 + 48 * Math.sin((minAngle - 90) * Math.PI / 180),
      stroke: "#2a1010",
      strokeWidth: "2",
      strokeLinecap: "round"
    }
  ), /* @__PURE__ */ React.createElement("circle", { cx: "70", cy: "70", r: "3.5", fill: t.redDeep })))), /* @__PURE__ */ React.createElement("svg", { style: { position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 200, height: 40, pointerEvents: "none" } }, /* @__PURE__ */ React.createElement("path", { d: "M 10 30 Q 100 -10 190 30", stroke: "#b89040", strokeWidth: "3", fill: "none", strokeDasharray: "2 2" })));
}
function Telegram({ x, y, rotate = 0, width = 360, entry = 0, duration = 0, localTime = 0, lang, event }) {
  const appear = Math.min(1, Math.max(0, (localTime - entry) / 0.6));
  const offsetY = (1 - appear) * 60;
  const op = appear;
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: x,
    top: y + offsetY,
    width,
    transform: `rotate(${rotate}deg)`,
    opacity: op,
    transition: "opacity .1s",
    boxShadow: "0 6px 20px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.3)",
    fontFamily: f.stamp,
    color: "#2a1010"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    padding: "18px 22px 24px",
    ...paperBg({ base: "#f0e0b0", vignette: false }),
    border: `1px solid ${t.paperDark}`,
    position: "relative"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    background: `repeating-linear-gradient(90deg, transparent 0 8px, rgba(100,70,30,.6) 8px 9px, transparent 9px 16px)`
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 11,
    fontFamily: f.mono,
    letterSpacing: "0.2em",
    color: "#6a4a20",
    borderBottom: "1px dashed #8a6a40",
    paddingBottom: 6,
    display: "flex",
    justifyContent: "space-between"
  } }, /* @__PURE__ */ React.createElement("span", null, lang === "ru" ? "\u0422\u0415\u041B\u0415\u0413\u0420\u0410\u041C\u041C\u0410" : "TELEGRAM"), /* @__PURE__ */ React.createElement("span", null, event.date)), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 12,
    fontSize: 18,
    fontFamily: f.stamp,
    lineHeight: 1.35,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    wordSpacing: "0.15em"
  } }, event.title), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: f.stamp,
    lineHeight: 1.5,
    color: "#3a2010"
  } }, event.note), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 18,
    right: 18,
    transform: "rotate(8deg)",
    border: `2px solid ${t.redDeep}`,
    padding: "4px 10px",
    color: t.redDeep,
    fontSize: 10,
    letterSpacing: "0.2em",
    fontFamily: f.mono,
    fontWeight: 700,
    opacity: 0.8
  } }, lang === "ru" ? "\u041F\u0420\u0418\u041D\u042F\u0422\u041E" : "RECEIVED")));
}
function Poster({ x, y, rotate = 0, width = 280, year, lang }) {
  const posters = {
    1918: {
      ru: { top: "\u0421\u0412\u041E\u0411\u041E\u0414\u0410", mid: "\u0418\u041B\u0418", bot: "\u0421\u041C\u0415\u0420\u0422\u042C", color: t.red },
      en: { top: "FREEDOM", mid: "OR", bot: "DEATH", color: t.red }
    },
    1919: {
      ru: { top: "\u0412\u0421\u0415", mid: "\u041D\u0410 \u0411\u041E\u0420\u042C\u0411\u0423", bot: "\u0421 \u0414\u0415\u041D\u0418\u041A\u0418\u041D\u042B\u041C!", color: t.redDeep },
      en: { top: "ALL", mid: "AGAINST", bot: "DENIKIN!", color: t.redDeep }
    },
    1920: {
      ru: { top: "\u0422\u042B", mid: "\u0417\u0410\u041F\u0418\u0421\u0410\u041B\u0421\u042F", bot: "\u0414\u041E\u0411\u0420\u041E\u0412\u041E\u041B\u042C\u0426\u0415\u041C?", color: "#8a3010" },
      en: { top: "HAVE YOU", mid: "ENLISTED AS A", bot: "VOLUNTEER?", color: "#8a3010" }
    },
    1921: {
      ru: { top: "\u041F\u041E\u041C\u041E\u0413\u0418!", mid: "\u0413\u041E\u041B\u041E\u0414", bot: "\u0412 \u041F\u041E\u0412\u041E\u041B\u0416\u042C\u0415", color: "#6b0d0d" },
      en: { top: "HELP!", mid: "FAMINE", bot: "IN THE VOLGA", color: "#6b0d0d" }
    },
    1922: {
      ru: { top: "\u041C\u0418\u0420", mid: "\u0422\u0420\u0423\u0414", bot: "\u041E\u041A\u0422\u042F\u0411\u0420\u042C", color: t.red },
      en: { top: "PEACE", mid: "LABOR", bot: "OCTOBER", color: t.red }
    }
  };
  const p = posters[year][lang];
  if (year === 1920) {
    return /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: x,
      top: y,
      width,
      height: width * 1.45,
      transform: `rotate(${rotate}deg)`,
      boxShadow: "0 14px 32px rgba(0,0,0,.65)",
      background: "#f0dcae",
      padding: 6,
      border: `1px solid ${t.paperDark}`
    } }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: "assets/moor-poster.jpg",
        alt: "\u041C\u043E\u043E\u0440. \u0422\u044B \u0437\u0430\u043F\u0438\u0441\u0430\u043B\u0441\u044F \u0434\u043E\u0431\u0440\u043E\u0432\u043E\u043B\u044C\u0446\u0435\u043C? (1920)",
        style: {
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "sepia(0.15) contrast(1.05)"
        }
      }
    ), /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      bottom: -18,
      left: 10,
      fontFamily: f.mono,
      fontSize: 10,
      color: "#5a4020",
      letterSpacing: "0.15em"
    } }, "\u0414. \u041C\u041E\u041E\u0420 \xB7 1920"));
  }
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: x,
    top: y,
    width,
    height: width * 1.4,
    transform: `rotate(${rotate}deg)`,
    boxShadow: "0 10px 26px rgba(0,0,0,.55)",
    ...paperBg({ base: "#e8d4a8", vignette: false }),
    padding: 20,
    fontFamily: f.display,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${t.paperDark}`
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 10,
    border: `3px solid ${p.color}`,
    pointerEvents: "none"
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: width * 0.14,
    fontWeight: 900,
    color: p.color,
    letterSpacing: "0.02em",
    marginBottom: 10
  } }, p.top), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: width * 0.22,
    fontWeight: 900,
    color: p.color,
    fontStyle: "italic",
    letterSpacing: "-0.02em",
    lineHeight: 1,
    textAlign: "center"
  } }, p.mid), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: width * 0.13,
    fontWeight: 900,
    color: p.color,
    letterSpacing: "0.05em",
    marginTop: 10
  } }, p.bot), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 20,
    fontSize: 11,
    fontFamily: f.mono,
    color: "#5a4020",
    letterSpacing: "0.2em"
  } }, year));
}
function PhotoCard({ x, y, rotate = 0, width = 220, caption, era = 1918 }) {
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: x,
    top: y,
    width,
    transform: `rotate(${rotate}deg)`,
    background: "#f5f0dc",
    padding: "14px 14px 36px",
    boxShadow: "0 8px 20px rgba(0,0,0,.5)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    height: width * 1.1,
    background: [
      "repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0 1px, transparent 1px 3px)",
      "radial-gradient(ellipse 60% 50% at 50% 40%, #8a7a5a 0%, #4a3a24 70%, #2a2010 100%)"
    ].join(","),
    position: "relative"
  } }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 100 100", style: { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 } }, /* @__PURE__ */ React.createElement("circle", { cx: "35", cy: "40", r: "8", fill: "#1a1408" }), /* @__PURE__ */ React.createElement("path", { d: "M 22 80 Q 22 55 35 55 Q 48 55 48 80 Z", fill: "#1a1408" }), /* @__PURE__ */ React.createElement("circle", { cx: "60", cy: "42", r: "7", fill: "#2a2010" }), /* @__PURE__ */ React.createElement("path", { d: "M 48 80 Q 48 58 60 58 Q 72 58 72 80 Z", fill: "#2a2010" })), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at center, transparent 50%, rgba(30,20,0,.5) 100%)"
  } })), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 12,
    fontFamily: f.stamp,
    fontSize: 12,
    color: "#4a3020",
    textAlign: "center",
    letterSpacing: "0.05em"
  } }, caption), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    bottom: 6,
    right: 10,
    fontFamily: f.mono,
    fontSize: 9,
    color: "#7a5a30",
    letterSpacing: "0.1em"
  } }, era));
}
function DirectionA({ lang, time, duration, years }) {
  const yearSpan = duration / years.length;
  const yearIdx = Math.min(years.length - 1, Math.floor(time / yearSpan));
  const inYearT = (time - yearIdx * yearSpan) / yearSpan;
  const year = years[yearIdx];
  const data = year[lang];
  const eventIdx = Math.min(data.events.length - 1, Math.floor(inYearT * data.events.length));
  const event = data.events[eventIdx];
  const localEventT = inYearT * data.events.length % 1;
  const totalMinutes = time / duration * 60 * 18;
  const compassRot = yearIdx * 40 + inYearT * 15;
  const curEvent = data.events[eventIdx];
  const prevEvent = eventIdx > 0 ? data.events[eventIdx - 1] : null;
  const commanders = {
    ru: ["\u041B. \u0422\u0440\u043E\u0446\u043A\u0438\u0439", "\u041C. \u0424\u0440\u0443\u043D\u0437\u0435", "\u0421. \u0411\u0443\u0434\u0451\u043D\u043D\u044B\u0439", "\u041C. \u0422\u0443\u0445\u0430\u0447\u0435\u0432\u0441\u043A\u0438\u0439", "\u0412. \u0411\u043B\u044E\u0445\u0435\u0440"],
    en: ["L. Trotsky", "M. Frunze", "S. Budyonny", "M. Tukhachevsky", "V. Bl\xFCcher"]
  };
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    ...woodBg(),
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: "radial-gradient(ellipse 75% 65% at 50% 50%, transparent 35%, rgba(0,0,0,.65) 100%)"
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: "50%",
    top: "42%",
    transform: "translate(-50%, -50%)",
    width: 1700,
    height: 900,
    background: "radial-gradient(ellipse at center, rgba(255,220,150,.22) 0%, transparent 55%)",
    pointerEvents: "none"
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 260,
    top: 170,
    width: 1400,
    height: 840
  } }, /* @__PURE__ */ React.createElement(DeskMap, { year: { ...year, lang }, x: 0, y: 0, width: 1400, rotate: -1.2 })), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 60,
    top: 170,
    width: 400,
    transform: "rotate(-2deg)",
    zIndex: 6
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#f0dcae",
    border: `1px solid ${t.paperDark}`,
    padding: "16px 22px 20px",
    boxShadow: "0 10px 28px rgba(0,0,0,.6)",
    position: "relative"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: -10,
    left: 24,
    width: 44,
    height: 22,
    background: t.brass,
    border: `1px solid #3a2010`,
    borderRadius: 2
  } }), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: f.mono,
    fontSize: 12,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: t.inkFaint
  } }, data.chapter), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 92,
    fontFamily: f.display,
    fontStyle: "italic",
    lineHeight: 0.9,
    color: t.redDeep,
    letterSpacing: "-0.03em",
    marginTop: 4,
    textShadow: "0 1px 0 rgba(255,240,200,.3)"
  } }, year.year), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: 17,
    fontFamily: f.body,
    fontStyle: "italic",
    color: t.ink,
    marginTop: 6,
    lineHeight: 1.3
  } }, data.subtitle))), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 90,
    top: 430,
    width: 340,
    transform: "rotate(2deg)",
    zIndex: 5,
    ...paperBg({ base: "#e8d6a8", vignette: false }),
    border: `1px solid ${t.paperDark}`,
    padding: "16px 20px",
    boxShadow: "0 10px 22px rgba(0,0,0,.55)",
    fontFamily: f.body,
    fontSize: 15,
    lineHeight: 1.45,
    color: t.ink,
    fontStyle: "italic"
  } }, data.lede), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 110,
    top: 720,
    zIndex: 7,
    filter: "drop-shadow(0 10px 20px rgba(0,0,0,.6))"
  } }, /* @__PURE__ */ React.createElement(Compass, { x: 0, y: 0, size: 170, rotation: compassRot })), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    right: 510,
    top: 160,
    zIndex: 7,
    filter: "drop-shadow(0 12px 24px rgba(0,0,0,.65))",
    transform: "rotate(-4deg)"
  } }, /* @__PURE__ */ React.createElement(PocketWatch, { x: 0, y: 0, size: 128, minutes: totalMinutes })), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    right: 70,
    top: 200,
    zIndex: 6,
    width: 260,
    height: 260 * 1.45,
    filter: "drop-shadow(0 14px 28px rgba(0,0,0,.6))"
  } }, /* @__PURE__ */ React.createElement(Poster, { x: 0, y: 0, rotate: 5, width: 260, year: year.year, lang })), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    right: 90,
    top: 620,
    zIndex: 7,
    width: 210,
    height: 210 * 1.4,
    filter: "drop-shadow(0 10px 22px rgba(0,0,0,.6))"
  } }, /* @__PURE__ */ React.createElement(
    PhotoCard,
    {
      x: 0,
      y: 0,
      rotate: -5,
      width: 210,
      caption: commanders[lang][yearIdx],
      era: year.year
    }
  )), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 870,
    top: 770,
    width: 460,
    transform: "rotate(-1deg)",
    zIndex: 5,
    ...paperBg({ base: "#e0cea0", vignette: false }),
    border: `1px solid ${t.paperDark}`,
    padding: "14px 20px",
    boxShadow: "0 10px 20px rgba(0,0,0,.55)"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: f.display,
    fontStyle: "italic",
    fontSize: 20,
    lineHeight: 1.3,
    color: t.ink
  } }, data.quote.text), /* @__PURE__ */ React.createElement("div", { style: {
    fontFamily: f.mono,
    fontSize: 10,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: t.inkFaint,
    marginTop: 8
  } }, "\u2014 ", data.quote.by)), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    left: 510,
    top: 560,
    width: 440,
    height: 180,
    zIndex: 8
  } }, prevEvent && localEventT < 0.3 && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    opacity: Math.max(0, 1 - localEventT / 0.3),
    transform: `translateY(${localEventT / 0.3 * 20}px) rotate(-3deg)`,
    filter: "drop-shadow(0 12px 22px rgba(0,0,0,.6))"
  } }, /* @__PURE__ */ React.createElement(
    Telegram,
    {
      x: 0,
      y: 0,
      rotate: 0,
      width: 440,
      entry: 0,
      duration: 1,
      localTime: 1,
      lang,
      event: prevEvent
    }
  )), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    opacity: Math.min(1, localEventT / 0.3 + 0.3),
    transform: `translateY(${Math.max(0, (1 - localEventT / 0.3) * 20)}px) rotate(2deg)`,
    filter: "drop-shadow(0 14px 26px rgba(0,0,0,.65))"
  } }, /* @__PURE__ */ React.createElement(
    Telegram,
    {
      x: 0,
      y: 0,
      rotate: 0,
      width: 440,
      entry: 0,
      duration: 1,
      localTime: 1,
      lang,
      event: curEvent
    }
  ))), /* @__PURE__ */ React.createElement(window.DustParticles, { count: 28 }));
}
window.DirectionA = DirectionA;
