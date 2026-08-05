/* Button.jsx — outline / solid brass / red / square close.
   Пороги тач-цели ДВА: 120px основная навигация (--touch-hit),
   64px управляющий элемент внутри раздела (--touch-min). No hover.

   Правка 2026-08-05: заголовок этого файла объявлял 64/120 верно,
   а КОД противоречил сам себе — size='sm' давал 48, IconButton 56.
   Оба ниже порога. Тот же дефект, что --touch-min: 48px в общем CSS
   и min-height:48px в preview/buttons.html: одна ошибка, семь адресов. */

const Button = ({
  children, variant = 'outline', size = 'md',
  onClick, accent = 'brass', as = 'button', ...rest
}) => {
  const Tag = as;
  const palette = accent === 'red'
    ? { line: 'var(--signal-red)', solidBg: 'var(--signal-red)', solidFg: 'var(--paper-white)' }
    : { line: 'var(--brass)',      solidBg: 'var(--brass)',      solidFg: 'var(--iron-grey)' };

  const variantStyle = variant === 'solid'
    ? { background: palette.solidBg, color: palette.solidFg, border: `1.5px solid ${palette.line}` }
    : variant === 'ghost'
      ? { background: 'transparent', color: 'var(--paper-white)', border: '1.5px solid transparent' }
      : { background: 'transparent', color: palette.line, border: `1.5px solid ${palette.line}` };

  // 'sm' больше не 48: нижний порог управляющего элемента — 64.
  // Мельче делается ТОЛЬКО видимая пилюля, а хит-зона добирается
  // парным ::before — так сделана «к экспозиции». Размер и область
  // нажатия могут различаться, порог относится ко второму.
  const sizeStyle = size === 'lg'
    ? { minHeight: 120, padding: '0 48px', fontSize: 16 }   // основная навигация
    : size === 'sm'
      ? { minHeight: 64, padding: '0 22px', fontSize: 12 }
      : { minHeight: 64, padding: '0 32px', fontSize: 14 };

  return (
    <Tag
      className="lc-btn"
      onClick={onClick}
      style={{ ...buttonStyles.base, ...variantStyle, ...sizeStyle }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

// Было 56 — «почти порог», и это худший случай: выглядит прилично,
// а пальцем промахивается. Мерить попаданием (elementFromPoint по верху,
// центру и низу), а не computed-стилями.
const IconButton = ({ children, onClick, accent = 'red', size = 64, ...rest }) => {
  const bg = accent === 'red' ? 'var(--signal-red)' : 'rgba(10,6,3,.85)';
  const fg = 'var(--paper-white)';
  return (
    <button
      className="lc-btn"
      onClick={onClick}
      style={{
        ...buttonStyles.icon,
        width: size, height: size,
        borderRadius: size/2,
        background: bg, color: fg,
      }}
      {...rest}
    >
      {children}
    </button>
  );
};

const buttonStyles = {
  base: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 12,
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    borderRadius: 'var(--r-pill)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  icon: {
    display: 'grid', placeItems: 'center',
    border: '2px solid var(--brass)',
    fontFamily: 'var(--font-display)',
    fontSize: 26, lineHeight: 1,
    cursor: 'pointer', padding: 0,
  },
};

window.Button = Button;
window.IconButton = IconButton;
