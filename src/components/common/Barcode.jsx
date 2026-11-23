// Code 128 (set B) barcode, readable by standard barcode scanners.
// Every different value produces a different, scannable pattern.

const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312",
  "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
  "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131",
  "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
  "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
  "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
  "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114",
  "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112",
  "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
  "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412",
  "211214", "211232", "2331112",
];
const START_B = 104;
const START_C = 105;
const CODE_B = 100;
const CODE_C = 99;
const STOP = 106;

const digitRun = (text, from) => {
  let end = from;
  while (end < text.length && text[end] >= "0" && text[end] <= "9") end += 1;
  return end - from;
};

// Uses set C (two digits per symbol) for long digit runs and set B otherwise,
// which keeps codes short and the bars wide enough for cameras to read.
function toCodes(text) {
  const firstRun = digitRun(text, 0);
  let set = firstRun >= 4 && firstRun % 2 === 0 ? "C" : "B";
  const codes = [set === "C" ? START_C : START_B];
  let index = 0;
  while (index < text.length) {
    const run = digitRun(text, index);
    if (set === "B" && run >= 4) {
      if (run % 2 === 1) {
        codes.push(text.charCodeAt(index) - 32);
        index += 1;
      }
      codes.push(CODE_C);
      set = "C";
    } else if (set === "C" && run >= 2) {
      codes.push(Number(text.slice(index, index + 2)));
      index += 2;
    } else if (set === "C") {
      codes.push(CODE_B);
      set = "B";
    } else {
      codes.push(text.charCodeAt(index) - 32);
      index += 1;
    }
  }
  return codes;
}

export function encodeCode128(value) {
  const text = String(value ?? "").replace(/[^\x20-\x7e]/g, "?");
  const codes = toCodes(text);
  const checksum =
    codes.reduce((sum, code, index) => sum + code * (index === 0 ? 1 : index), 0) % 103;
  codes.push(checksum, STOP);

  const bars = [];
  let x = 10; // quiet zone
  for (const code of codes) {
    const widths = PATTERNS[code];
    for (let index = 0; index < widths.length; index += 1) {
      const width = Number(widths[index]);
      if (index % 2 === 0) bars.push({ x, width });
      x += width;
    }
  }
  return { bars, width: x + 10 };
}

function Barcode({ value, height = 48, showText = true, className = "" }) {
  const { bars, width } = encodeCode128(value);
  return (
    <div className={`barcode ${className}`.trim()}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Barcode ${value}`}
        shapeRendering="crispEdges"
      >
        <rect width={width} height={height} fill="#fff" />
        {bars.map((bar) => (
          <rect key={bar.x} x={bar.x} y="0" width={bar.width} height={height} fill="#111" />
        ))}
      </svg>
      {showText && <span>{value}</span>}
    </div>
  );
}

export default Barcode;
