// Точка входа раздела «Персоналии». Раньше жила инлайном в people.html под
// <script type="text/babel">; вынесена в файл, чтобы проходить предкомпиляцию
// вместе с остальным JSX (scripts/expo/build-jsx.mjs).

// PersonalitiesApp объявлен на верхнем уровне people-ui.jsx и уже виден здесь.
// Переобъявлять его через `const {…} = window` нельзя — общая область видимости
// скриптов страницы, второе объявление = SyntaxError.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PersonalitiesApp/>);
