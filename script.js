import { aListe } from "./artikkelliste.js";

let artikkelnamn = null;

let fullArtikkelTekstSensurert = null;
let fullArtikkelTekstUsensurert = null;
let artikkelData = null;
let ingressTemplateHTMLRaw = "";
let ingressTemplateDecorated = "";
let ingressMeta = [];
const litenFeilLyd = new Audio("./lydar/feil1.wav")
const storFeilLyd = new Audio("./lydar/feil2.wav")
const vinnLyd = new Audio("./lydar/rett.wav")

for (const lyd of [litenFeilLyd, storFeilLyd, vinnLyd]){
    lyd.preload = "auto";
    lyd.volume = 0.5;
}

async function fetchArtikkel(sensurert = true){
    if (sensurert && fullArtikkelTekstSensurert) return fullArtikkelTekstSensurert;
    if (!sensurert && fullArtikkelTekstUsensurert) return fullArtikkelTekstUsensurert;
    try{
        artikkelData = await velArtikkel();
        const ogsåKjentSom = hentOgsåKjentSom(artikkelData.metadata?.alternative_form);
        const råtekst = artikkelData.xhtml_body;
        const råtekstMedTittel = leggTilTittel(råtekst, artikkelnamn)
        fullArtikkelTekstSensurert = sensurerArtikkelHTML(råtekstMedTittel, artikkelnamn, ogsåKjentSom);
        fullArtikkelTekstUsensurert = strippAltUnntattKursiv(råtekstMedTittel);
        if (sensurert){
            return fullArtikkelTekstSensurert;
        } else{
            return fullArtikkelTekstUsensurert;
        }
    }
    catch(error){
        console.error(error);
        return "Feil: Klarte ikkje hente ein artikkel.";
    }
}

function hentOgsåKjentSom(html) {
    if (!html) return [];

    const temp = document.createElement("div");
    temp.innerHTML = html;

    return temp.textContent
        .replace(/\([^)]*\)/g, "") //fjernar parantesar
        .replace(/\b(?:eng\.?|engelsk|på engelsk|nyn\.?|nynorsk|på nynorsk|bokm\.?|bokmål|på bokmål|fransk|på fransk|italiensk|på italiensk|tysk|på tysk|spansk|på spansk|latin|på latin|forkortelse for|fork\.? for|fork\.?)\b/gi, "") //fjernar spesifikke ord
        .split(/\s*(?:[;,]|\n|\bog\b|\beller\b)\s*/i) //splitt med: komma, semikolon, og, eller, line break
        .map(s => s.includes(":") ? s.split(":").slice(-1)[0] : s) //fjernar alt før kolon
        .map(s => s.trim())
        .filter(Boolean);
}

function visOgsåKjentSom(html = ""){
    const text = html.replace(/<[^>]*>/g, " ");

    const alleOKS = text
    .split(/\s*(?:[;,]|\n)\s*/) //ikkje splitt "og" og "eller" her, det kan skape rare visuelle resultat (vare- og tjenestebalanse)
    .map(s => s.trim())
    .filter(Boolean);

    if (alleOKS.length === 0) return "";
    if (alleOKS.length === 1) return alleOKS[0];
    if (alleOKS.length === 2) return alleOKS.join(" og ");

    const settSaman = alleOKS.slice(0, -1).join(", ") + " og " + alleOKS.at(-1);
    return settSaman.replace(/\s+/g, " ").trim();
}

let tapPopupKanLukkastMedTast = false;
let viserResultat = false;

function visTapPopup(opnaMedTast = false) {
    const popup = document.getElementById("tapPopup");
    popup.hidden = false;

    tapPopupKanLukkastMedTast = !opnaMedTast;
}

function lukkTapPopup() {
    document.getElementById("tapPopup").hidden = true;
    tapPopupKanLukkastMedTast = false;
}

function spelLyd(lyd){
    if (erMobil()) return;
    lyd.pause();
    lyd.currentTime = 0;
    lyd.play().catch(() => {
    });
}

function vaskArtikkelnamn(artikkelnamn){
    const utanPresisering = artikkelnamn.split("_-_")[0];

    const medMellomrom = utanPresisering.replace(/_/g, " ");

    return medMellomrom.trim();
}

function formaterForfattarar(authors = []) {
    const names = authors.map(a => a.full_name);

    if (names.length <= 1) return names[0] ?? "";
    if (names.length === 2) return names.join(" og ");

    return names.slice(0, -1).join(", ") + " og " + names.at(-1);
}

const ROMARTAL = new Map([
    ["i", 1],
    ["ii", 2],
    ["iii", 3],
    ["iv", 4],
    ["v", 5],
    ["vi", 6],
    ["vii", 7],
    ["viii", 8],
    ["ix", 9],
    ["x", 10],
    ["xi", 11],
    ["xii", 12],
    ["xiii", 13],
    ["xiv", 14],
    ["xv", 15],
    ["xvi", 16],
    ["xvii", 17],
    ["xviii", 18],
    ["xix", 19],
    ["xx", 20],
    ["xxi", 21],
    ["xxii", 22],
    ["xxiii", 23],
    ["xxiv", 24],
    ["xxv", 25],
    ["xxvi", 26],
    ["xxvii", 27],
    ["xxviii", 28],
    ["xxix", 29],
    ["xxx", 30],
]);

const ORDENSTAL = new Map([
    ["første", 1],
    ["fyrste", 1],
    ["andre", 2],
    ["annen", 2],
    ["tredje", 3],
    ["fjerde", 4],
    ["femte", 5],
    ["sjette", 6],
    ["sjuende", 7],
    ["sjuande", 7],
    ["syvende", 7],
    ["åttende", 8],
    ["åttande", 8],
    ["niende", 9],
    ["niande", 9],
    ["tiende", 10],
    ["tiande", 10],
    ["ellevte", 11],
    ["tolvte", 12],
    ["trettende", 13],
    ["trettande", 13],
    ["fjortende", 14],
    ["fjortande", 14],
    ["femtende", 15],
    ["femtande", 15],
    ["sekstende", 16],
    ["sekstande", 16],
    ["syttende", 17],
    ["syttande", 17],
    ["attende", 18],
    ["attande", 18],
    ["nittende", 19],
    ["nittande", 19],
    ["tjuende", 20],
    ["tyvende", 20],
    ["tjueførste", 21],
    ["tjuefyrste", 21],
    ["tjueandre", 22],
    ["tjuetredje", 23],
    ["tjuefjerde", 24],
    ["tjuefemte", 25],
    ["tjuesjette", 26],
    ["tjuesjuende", 27],
    ["tjuesjuande", 27],
    ["tjuesyvende", 27],
    ["tjueåttende", 28],
    ["tjueåttande", 28],
    ["tjueniende", 29],
    ["tjueniande", 29],
    ["trettiende", 30],
    ["trettiande", 30],
]);

function normaliserTalOgOrdenstal(tekst) {
    tekst = tekst.toLowerCase();

    tekst = tekst.replace( //den niande etc.
        /\bden\s+([a-zæøå]+)\b/g,
        (match, ord) => {
            const n = ORDENSTAL.get(ord);
            return n ? `#${n}` : match;
        }
    );

    tekst = tekst.replace( //niande etc.
        /\b([a-zæøå]+)\b/g,
        (match, ord) => {
            const n = ORDENSTAL.get(ord);
            return n ? `#${n}` : match;
        }
    );

    tekst = tekst.replace( //9 og 9. etc.
        /(^|[^#0-9a-zæøå])([0-9]{1,2})\.?(?=$|[^0-9a-zæøå])/g,
        (match, før, n) => `${før}#${n}`
    );

    tekst = tekst.replace( //IX, ix etc.
        /\b([ivxlcdm]{1,10})\b/gi,
        (match, roman) => {
            const n = ROMARTAL.get(roman.toLowerCase());
            return n ? `#${n}` : match.toLowerCase();
        }
    );

    return tekst;
}

function sluttarMedKongetal(tittel) { //får ikkje nesten rett-advarsel for regentar
    const normalisert = normaliserTilNorskEkvivalent(tittel);

    return /#\d+$/.test(normalisert);
}

function normaliserTilNorskEkvivalent(tekst) { //sjølv om denne heiter tilNorskEkvivalent, er det også denne som dealer med kongetal
    tekst = tekst
        .toLowerCase()

        .replace(/þ/g, "th")
        .replace(/ð/g, "d")
        .replace(/ß/g, "ss")
        .replace(/œ/g, "oe")
        .replace(/ł/g, "l")
        .replace(/đ/g, "d")
        .replace(/ŋ/g, "n")
        .replace(/ɲ/g, "n")

        .normalize("NFD") //gjer t.d. ñ -> n
        .replace(/[\u0300-\u036f]/g, "")

    tekst = normaliserTalOgOrdenstal(tekst);

    return tekst
        .replace(/\s+/g, " ")
        .trim();
}

function fjernBindestrek(tekst){
    return tekst.replace(/-/g,"");
}

function bindestrekTilMellomrom(tekst){
    return tekst.replace(/-/g," ");
}

function giStorForbokstav(ord){
    if (!ord) {
        return "";
    }
    return ord.charAt(0).toUpperCase() + ord.slice(1);
}

function hintOmForbokstav(ord){
    return ord.replace(/[^\s/–—-]+/g, word => {
        if (word.length === 1) return word;
        return word[0] + "…";
    });
}

function dynamiskHint(answer, typed) {
  const partsAnswer = answer.split(/([\s\/–—-]+)/); //beheld separatorar
  const hintParts = partsAnswer.map(p =>
    /^[\s\/–—-]+$/.test(p) ? p : (p.length <= 1 ? p : p[0] + "…")
  );

  const partsTyped = typed.split(/([\s\/–—-]+)/).filter(p => p !== "");

  let k = 0; //indeks

  for (let i = 0; i < partsTyped.length && k < hintParts.length; i++){
    const t = partsTyped[i];
    const tIsSep = /^[\s\/–—-]+$/.test(t);

    if (tIsSep) { //konsumer nøyaktig ein separator
      if (k < partsAnswer.length && /^[\s\/–—-]+$/.test(partsAnswer[k])) {
        hintParts[k] = "";
        k++;
      }
      continue;
    }

    while (k < partsAnswer.length && /^[\s\/–—-]+$/.test(partsAnswer[k])) k++;
    if (k >= partsAnswer.length) break;

    let hw = hintParts[k];

    const nextTypedIsSep = i + 1 < partsTyped.length && /^[\s\/–—-]+$/.test(partsTyped[i + 1]);

    if (t.length >= 1) hw = hw.slice(1); //fjernar forbokstav
    if ((t.length >= 2 || nextTypedIsSep) && hw.startsWith("…")) hw = hw.slice(1); //fjernar ellipse

    hintParts[k] = hw;
    k++;
  }

  return hintParts.join("");
}

function makeDecoratedToken(token, metaIndex = null, endingInside = "") {
  const wrap = document.createElement("span");
  wrap.className = "sensur-token";

  if (metaIndex !== null) wrap.dataset.meta = String(metaIndex); // mapper ingressMeta
  wrap.dataset.endingInside = endingInside;

  const b1 = document.createElement("span");
  b1.className = "sensur-bracket";
  b1.textContent = "[";

  const mid = document.createTextNode(token.slice(1, -1)); //første indre (t.d. "…ing")
  const b2 = document.createElement("span");
  b2.className = "sensur-bracket";
  b2.textContent = "]";

  wrap.append(b1, mid, b2);
  return wrap;
}

function dekorerSensur(html, meta) {
  if (!html) return html;

  const container = document.createElement("div");
  container.innerHTML = html;

  const TOKEN_RE = /\[\u2026[^\]]*\]|\[(?:også kjent som|variantform|del av tittel)\]/gi;

  let idx = 0;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.nodeValue && node.nodeValue.includes("[")
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const s = node.nodeValue;
    let last = 0;
    let changed = false;

    const frag = document.createDocumentFragment();

    for (const m of s.matchAll(TOKEN_RE)) {
      const token = m[0];
      const start = m.index;

      if (start > last) frag.append(document.createTextNode(s.slice(last, start)));

      const isEllipsis = token[1] === "…";

      if (isEllipsis) {
        const info = meta?.[idx] ?? null;     //ikkje idx++ endå
        const myIndex = idx++;

        if (info?.skipFill) { //om klamma er frå originalteksten, ikkje rør ho
          frag.append(document.createTextNode(token));
        } else {
          const endingInside = token.slice(2, -1); //det som er etter ellipsen i klammer
          frag.append(makeDecoratedToken(token, myIndex, endingInside));
        }
      } else { //dekorer, men treng ikkje meta indeks
        frag.append(makeDecoratedToken(token, null, ""));
      }

      last = start + token.length;
      changed = true;
    }

    if (!changed) continue;
    if (last < s.length) frag.append(document.createTextNode(s.slice(last)));

    node.parentNode.replaceChild(frag, node);
  }

  return container.innerHTML;
}

function leggTilTittel(tekst, artikkelnamn) {
    if (!tekst) return tekst;

    const root = document.createElement("div"); //for html-tekst
    root.innerHTML = tekst;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { //finn første ikkje-mellomrom-bokstav
        acceptNode(node) {
            return node.nodeValue && node.nodeValue.trim()
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT;
        }
    });

    if (!walker.nextNode()) return tekst;

    const firstText = walker.currentNode.nodeValue.trim();
    const firstChar = firstText[0];

    if (!/[a-zæøå]/.test(firstChar)) return tekst; //berre om teksten startar med liten bokstav

    const firstWordMatch = firstText.match(/^([a-zæøå]+)/); //finn første ord
    const firstWord = firstWordMatch ? firstWordMatch[1] : "";

    const ingenKommaEtter = new Set(["er", "var", "betyr"]);

    const tittel = giStorForbokstav(vaskArtikkelnamn(artikkelnamn));

    const komma = ingenKommaEtter.has(firstWord) ? "" : ",";

    return `${tittel}${komma} ${tekst}`;
}

function strippAltUnntattKursiv(html){
    const root = document.createElement("div");
    root.innerHTML = html;

    const KEEP = new Set(["EM", "I"]);            //kursiv
    const DROP = new Set(["SCRIPT", "STYLE"]);    //fjernar
    const BREAK_TO_SPACE = new Set(["BR"]);       //gjer til mellomrom
    const BLOCK_LIKE = new Set([
        "P","DIV","SECTION","ARTICLE","HEADER","FOOTER","ASIDE",
        "UL","OL","LI","DL","DT","DD",
        "H1","H2","H3","H4","H5","H6",
        "TABLE","THEAD","TBODY","TFOOT","TR","TD","TH",
        "BLOCKQUOTE"
    ]);

    function insertSpaceBefore(node) {
        const prev = node.previousSibling;
        const needs =
            !prev ||
            (prev.nodeType === Node.TEXT_NODE && !/\s$/.test(prev.nodeValue)) ||
            (prev.nodeType === Node.ELEMENT_NODE && prev.tagName === "EM" && !/\s$/.test(prev.textContent));
        if (needs) node.parentNode.insertBefore(document.createTextNode(" "), node);
    }

    function insertSpaceAfter(node) {
        const next = node.nextSibling;
        const needs =
            !next ||
            (next.nodeType === Node.TEXT_NODE && !/^\s/.test(next.nodeValue)) ||
            (next.nodeType === Node.ELEMENT_NODE && next.tagName === "EM" && !/^\s/.test(next.textContent));
        if (needs) node.parentNode.insertBefore(document.createTextNode(" "), next);
    }

    function unwrapElement(el) {  //mellomrom før og etter
        if (BLOCK_LIKE.has(el.tagName)) {
            insertSpaceBefore(el);
            insertSpaceAfter(el);
        }

        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
        el.remove();
    }

    const all = [...root.querySelectorAll("*")].reverse();

    for (const el of all) {
        const tag = el.tagName;

        if (DROP.has(tag)) {
            el.remove();
            continue;
        }

        if (BREAK_TO_SPACE.has(tag)) {
            el.replaceWith(document.createTextNode(" "));
            continue;
        }

        if (KEEP.has(tag)) {
            [...el.attributes].forEach(a => el.removeAttribute(a.name));
            continue;
        }

        unwrapElement(el);
    }

    root.innerHTML = root.innerHTML
        .replace(/\u00A0/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\s+\n\s+/g, "\n")
        .trim();

    return root.innerHTML;
}

function sensurerArtikkelHTML(html, artikkelnamn, ogsåKjentSomListe = []) {
    const cleaned = strippAltUnntattKursiv(html);

    const container = document.createElement("div");
    container.innerHTML = cleaned;

    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
        node.nodeValue = sensurerArtikkeltekst(node.nodeValue, artikkelnamn, ogsåKjentSomListe);
    }

    return container.innerHTML;
}

function hentAnkerEtterKlamme(s, fromIndex, { //finn bokstavrekke etter klamme
    maxLen = 20,     //anker opp til dette
    minLen = 2       //minst så mange
} = {}) {
    let k = fromIndex;

    const nextCensor = s.indexOf("[…", k); //stopp om det kjem ein ny sensur
    const stopAt = nextCensor === -1 ? s.length : nextCensor;

    const raw = s.slice(k, Math.min(stopAt, k + maxLen));
    if (raw.length < minLen) return ""; //ikkje brukbart anker
    return raw;
}

function finnAnkerPos(u, j, anchor) { //finn kor ankeret er i den usensurerte teksten
    if (!anchor) return -1;

    const reSrc = escapeRegex(anchor).replace(/\s+/g, "\\s+");
    const re = new RegExp(reSrc);

    const slice = u.slice(j);
    const m = slice.match(re);
    if (!m) return -1;

    return j + m.index;
}

function hoppeOverOriginalKlamme(u, j) {
  if (u[j] !== "[") return { isOriginal: false, newJ: j };
  const closeU = u.indexOf("]", j + 1);
  if (closeU === -1) return { isOriginal: false, newJ: j }; //ingen slutt, ignorer
  return { isOriginal: true, newJ: closeU + 1 };
}

async function byggOrdgrense(){
    const sHtml = visSetningar(await fetchArtikkel(true), runde);
    const uHtml = visSetningar(await fetchArtikkel(false), runde);

    const tmpS = document.createElement("div");
    tmpS.innerHTML = sHtml;
    const s = tmpS.textContent; //sensurert tekst

    const tmpU = document.createElement("div");
    tmpU.innerHTML = uHtml;
    const u = tmpU.textContent; //usensurert tekst

    const meta = [];
    let i = 0; //peikar i sensurert tekst
    let j = 0; //peikar i usensurert tekst

    while (i < s.length && j < u.length){ //vi har ikkje gått gjennom alle bokstavar
        if (s[i] === "[" && s[i + 1] === "…" && s[i + 2] !== "]"){ //klamme med … + tekst inni
            const close = s.indexOf("]", i + 2);
            if (close === -1) break;

            const { isOriginal, newJ } = hoppeOverOriginalKlamme(u, j); //sjekk om klammene er der frå originalteksten
            if (isOriginal) {
                meta.push({ skipFill: true, stemLen: 0, hasEndingInside: true });
                i = close + 1;
                j = newJ;
                continue;
            }

            const endingInside = s.slice(i + 2, close);
            const anchor = hentAnkerEtterKlamme(s, close + 1);

            let anchorStart = finnAnkerPos(u, j, anchor); //finn kor ankeret startar i det usensurerte

            if (anchorStart === -1){ //naudløysing om vi ikkje har brukbart anker
                anchorStart = j + finnStamme(vaskArtikkelnamn(artikkelnamn)).length - endingInside.length; //sats på at ordet er vanleg stamme + ending
            }

            const originalOrd = u.slice(j, anchorStart); //det sensurerte ordet er frå starten til ankeret startar
            const kortOrd = fjernBindestrek(originalOrd);

            const stemLen = Math.max(0, kortOrd.length - endingInside.length); //ordlengda minus ending inni klammene (ikkje minustal, berre i tilfelle)

            meta.push({ stemLen, endingInside });

            i = close + 1; //gå vidare forbi klammene
            j = anchorStart;
            continue;
        }

        if (s[i] === "[" && s[i + 1] === "…" && s[i + 2] === "]") { //for […] som er kortare enn oppslagsordet
            const close = i + 2;

            const { isOriginal, newJ } = hoppeOverOriginalKlamme(u, j);
            if (isOriginal) {
                meta.push({ skipFill: true, stemLen: 0, hasEndingInside: false });
                i = close + 1;
                j = newJ;
                continue;
            }

            const anchor = hentAnkerEtterKlamme(s, close + 1);
            let anchorStart = finnAnkerPos(u, j, anchor);

            if (anchorStart === -1) { //sikring
                anchorStart = j + finnStamme(vaskArtikkelnamn(artikkelnamn)).length;
            }

            const originalOrd = u.slice(j, anchorStart);
            const kortOrd = fjernBindestrek(originalOrd);

            const titleKortLen = fjernBindestrek(vaskArtikkelnamn(artikkelnamn)).length;
            const stemLen = Math.min(kortOrd.length, titleKortLen); //kortaste av tittellengda og det sensurerte ordet

            meta.push({ stemLen, hasEndingInside: false });

            i = close + 1;
            j = anchorStart;
            continue;
        }

        if (s[i] === u[j]){
            i++; j++;
        } else {
            const nextU = u.indexOf(s[i], j);
            const nextS = s.indexOf(u[j], i);

            if (nextU !== -1 && (nextS === -1 || nextU - j <= nextS - i)) {
                j++;
            } else {
                i++;
            }
        }
    }

    return meta;
}

function erPotensiellEnding(tail){ //sjekk om det etter grensa kan vere starten på ei ending
    if (!tail) return true;

    const t = tail.toLowerCase();
    for (const e of ENDINGAR){
        if (e === t || e.startsWith(t)) return true; //ei ending eller starten på ei
    }
    return false;
}

function escapeHtml(s) { //unngå html-injection
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function fyllInnSensurDekorert(decoratedHtml, typedRaw){
  if (!decoratedHtml) return decoratedHtml;

  const typed = (typedRaw || "").trimStart();
  if (!typed) return decoratedHtml; //om dei ikkje har skrive noko, skal det vere ellipse

  const typedKort = fjernBindestrek(typed);
  const talBindeSkrive = typed.length - typedKort.length;

  const titleKortLen = fjernBindestrek(vaskArtikkelnamn(artikkelnamn)).length;

  const container = document.createElement("div");
  container.innerHTML = decoratedHtml;

  const tokens = container.querySelectorAll(".sensur-token[data-meta]");

  for (const el of tokens) {
    const metaIndex = Number(el.dataset.meta);
    const info = ingressMeta?.[metaIndex];
    if (!info || info.skipFill) continue; //om klammene er få originalteksten

    const endingInside = el.dataset.endingInside || "";
    const limit = info.stemLen + talBindeSkrive;
    const tail = typed.slice(limit);

    let inner;

    if (!erPotensiellEnding(tail)) { //om halen ikkje kan bli ending -> ikkje ha limit
      inner = typed + endingInside;
    } else if (endingInside) { //om halen kan bli ending -> ha limit
      inner = typed.slice(0, limit) + endingInside;
    } else {
      if (typed.length > limit && typedKort.length <= titleKortLen) inner = typed.slice(0, limit); //om det er utan ending inni, vi er over grensa, halen kan bli ei ending og ordet er kortare enn den fulle tittelen
      else inner = typed;
    }

    const mid = el.childNodes[1];
    if (mid && mid.nodeType === Node.TEXT_NODE) mid.nodeValue = inner;
  }

  return container.innerHTML;
}

const ENDINGAR = ["iseringanes","iseringenes","aktigastes","iseringane","iseringars","iseringene","iseringens","iseringers","aktigares","aktigaste","aktigeres","aktigstes","asjonenes","elegastes","iseringar","iseringas","iseringen","iseringer","ologianes","ologienes","ologiskes","slegastes","aktigare","aktigast","aktigere","aktigste","asjonene","asjonens","asjoners","elegares","elegaste","eligeres","eligstes","heitenes","iseringa","iserings","istiskes","itetanes","itetenes","legastes","ninganes","ningenes","ologiane","ologiars","ologiene","ologiens","ologiers","ologiske","sjonenes","slegares","slegaste","sligeres","sligstes","aktiges","aktigst","asjonen","asjoner","domanes","domenes","elegare","elegast","eligere","eligste","elsanes","elsenes","erienes","heitene","heiters","hetenes","igastes","ikasjon","inganes","ingenes","isering","ismenes","istanes","istenes","istiske","itetane","itetars","itetene","itetens","iteters","legares","legaste","ligeres","ligstes","nadanes","nadenes","ningane","ningars","ningene","ningens","ningers","ologiar","ologien","ologier","ologisk","sjonene","sjonens","sjoners","skapens","skapets","slegare","slegast","sligere","sligste","aktige","asjons","domane","domars","domene","domens","eaktig","eleges","eliges","eligst","elsane","elsars","elsene","elsens","elsers","eriene","eriers","eriets","heitas","heiter","hetene","hetens","heters","igaste","igares","igeres","igstes","ingane","ingars","ingene","ingens","ingers","ismene","ismens","ismers","istane","istars","istene","istens","isters","istisk","itetar","iteten","iteter","legare","legast","ligere","ligste","nadane","nadars","nadene","nadens","naders","ningar","ningas","ningen","ninger","ologis","sjonen","sjoner","skapas","skapen","skapet","sleges","sliges","sligst","sommes","aktig","andes","asjon","astes","domar","domen","elege","elens","elige","elsar","elsen","elser","elses","endes","erier","eriet","estes","heita","heits","hetas","heten","heter","igare","igast","igere","igste","ingar","ingas","ingen","inger","isere","iskes","ismen","ismer","ismes","istar","isten","ister","itets","lanes","leges","leiks","lenes","liges","ligst","nadar","naden","nader","ninga","nings","ologi","ranes","renes","sjons","skapa","skaps","slege","slige","somme","ande","anes","ares","aste","bare","bart","dere","dest","doms","edes","eleg","elen","elig","else","ende","enes","eres","eris","este","etes","heit","heta","hets","iges","igst","inga","ings","iske","isme","ists","itet","lane","lege","leik","lene","lige","ligs","nars","ners","ning","rane","rene","same","samt","sjon","skap","sleg","slig","somt","tere","test","ane","are","ars","ast","bar","dde","dom","ede","els","ene","ens","ere","eri","ers","est","ete","ets","het","ige","ing","isk","ist","lar","leg","ler","lig","nad","nar","ner","sam","som","tes","ar","as","dd","de","el","en","er","es","et","ig","le","ne","re","sk","st","te","tt","um","us","a","d","e","r","s","t"];

function finnStamme(ord) { //brukast av både sensuren og gjettinga
    const lower = ord.toLowerCase();
    for (const ending of ENDINGAR) {
        if (lower.endsWith(ending) && lower.length > ending.length){ //ikkje stripp bort heile ordet
            return ord.slice(0, -ending.length);
        }
    }
    return ord;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); //erstatt regexteikn
}

function sensurerArtikkeltekst(tekst, artikkelnamn, ogsåKjentSomListe = []){

    const OMLYD_GRUPPER = [
        ["mann", "menn"],
        ["fot", "føtt"],
        ["bok", "bøk"],
        ["bot", "bøt"],
        ["glo", "glør"],
        ["hand", "hånd", "hend"],
        ["and", "end"],
        ["tann", "tenn"],
        ["far", "fedr"],
        ["mor", "mødr"],
        ["gås", "gjess", "gjæs"],
        ["ku", "kyr"],
        ["kraft", "kreft"],
        ["finn", "fann", "funn"],
        ["skriv", "skrev", "skreiv"],
        ["driv", "drev", "dreiv"],
        ["stig", "steg", "steig"],
        ["få", "fikk"],
        ["gå", "gikk"],
        ["se", "så"],
        ["sjå", "se", "såg"],
        ["sett", "satt"],
        ["slå", "slo"],
        ["stå", "sto"],
        ["stjel", "stjal", "stjål"],
        ["stel", "stal", "stol"],
        ["syng", "sang", "song", "sung"],
        ["ta", "tok"],
        ["tving", "tvang", "tvung"]
    ];

    const OMLYD_MAP = new Map();

    for (const gruppe of OMLYD_GRUPPER) {
        for (const form of gruppe) {
            OMLYD_MAP.set(form, gruppe);
        }
    }

    const vaskaTittel = vaskArtikkelnamn(artikkelnamn);
    const normalTittel = fjernBindestrek(vaskaTittel); //for full tittelmatching
    const tittelForDel = bindestrekTilMellomrom(vaskaTittel); //splitt opp for delAvTittel
    const stamme = finnStamme(normalTittel);
    const tittelOrd = tittelForDel.split(/\s+/).filter(Boolean); //kvart ord for fleirordstitlar

    const DEL_POS = new Map(); //posisjonen til orda i fleirordstitlar

    tittelOrd.forEach((w, i) => {
        const pos = i + 1;

        function addPos(key) {
            key = key.toLowerCase();
            if (!DEL_POS.has(key)) DEL_POS.set(key, []);
            DEL_POS.get(key).push(pos);
        }

        addPos(w); //gi posisjonsnummer til heile ordet og for stems
        addPos(finnStamme(w));
    });

    const STAMMER = {
        normalStamme: new Set(),
        forenklaKonsonant: new Set(),
        omlydStamme: new Set(),
        ogsåKjentStamme: new Set(),
        ogsåKjentOgForenkla: new Set(),
        delAvTittel: new Set(),
        delAvTittelOgForenkla: new Set()
    };

    const STEM_INFO = new Map(); //type
    const STEM_POSKEY = new Map(); //posisjon for omlyd og forenkla frå delAvTittel

    function leggTilStamme(stem, type, posKey = null){
        if (!stem || !stem.trim()) return; //ikkje aksepter tom stem
        if (STEM_INFO.has(stem.toLowerCase())) return; //ikkje legg til om ordet allereie er lagt til
        STAMMER[type].add(stem);
        STEM_INFO.set(stem.toLowerCase(), type); //lagre kva type stamme det er

        if (posKey){
            STEM_POSKEY.set(stem.toLowerCase(), posKey.toLowerCase());
        }
    }

    leggTilStamme(normalTittel, "normalStamme");
    leggTilStamme(stamme, "normalStamme");

    if (tittelOrd.length > 1) { //legg til kvart ord i tittel som stem, om tittelen har fleire ord
        for (const ord of tittelOrd) {
            const key = ord.toLowerCase();
            leggTilStamme(ord, "delAvTittel", key); //heile ordet
            if (finnStamme(ord).length > 2){ //stem om stemmen er lengre enn to
                leggTilStamme(finnStamme(ord), "delAvTittel", key);
            } 
        }
    }

    for (const alt of ogsåKjentSomListe){
        const vaskaOKS = fjernBindestrek(vaskArtikkelnamn(alt));
        const oksStamme = finnStamme(vaskaOKS);

        leggTilStamme(vaskaOKS, "ogsåKjentStamme");
        leggTilStamme(oksStamme, "ogsåKjentStamme");
    }

    const omlydKjelder = new Set([
        ...STAMMER.normalStamme,
        ...STAMMER.ogsåKjentStamme,
        ...STAMMER.delAvTittel
    ]);

    for (const s of omlydKjelder){ //Finn omlydstammer. Taklar òg samansette: målmann -> målmenn
        for (const [base, gruppe] of OMLYD_MAP.entries()){
            if (s.toLowerCase().endsWith(base)){
                const prefiks = s.slice(0, s.length - base.length);
                for (const form of gruppe){
                    const nyStamme = prefiks + form;
                    if (nyStamme.toLowerCase() === s.toLowerCase()) continue; //ikkje merk originalforma som omlyd
                        if (STEM_INFO.get(s.toLowerCase()) === "ogsåKjentStamme"){ //ikkje byt oks til type omlyd
                            leggTilStamme(nyStamme, "ogsåKjentStamme");
                        } else if (STEM_INFO.get(s.toLowerCase()) === "delAvTittel"){ //ikkje byt delav til omlyd
                            const posKey = STEM_POSKEY.get(s.toLowerCase()) ?? s.toLowerCase(); //beheld posisjonen
                            leggTilStamme(nyStamme, "delAvTittel", posKey);
                        } else {
                            leggTilStamme(nyStamme, "omlydStamme");
                        }
                }
            }
        }
    }

    for (const alleStammer of Object.values(STAMMER)){ //legg til ein stamme med enkelkonsonant til slutt som berre skal brukast framfor ending med konsonant
        for (const s of alleStammer){
            if (/(bb|dd|ff|gg|kk|ll|mm|nn|pp|rr|ss|tt)$/.test(s)){
                if (STEM_INFO.get(s.toLowerCase()) === "ogsåKjentStamme"){ //både oks og forenkla
                    leggTilStamme(s.replace(/(.)\1$/, "$1"), "ogsåKjentOgForenkla");
                } else if (STEM_INFO.get(s.toLowerCase()) === "delAvTittel"){ //både del og forenkla
                    const posKey = STEM_POSKEY.get(s.toLowerCase()) ?? s.toLowerCase(); //beheld posisjonen
                    leggTilStamme(s.replace(/(.)\1$/, "$1"), "delAvTittelOgForenkla", posKey);
                } else {
                    leggTilStamme(s.replace(/(.)\1$/, "$1"), "forenklaKonsonant");
                }
            }
        }
    }

    const stemPattern = [
        ...STAMMER.normalStamme,
        ...STAMMER.forenklaKonsonant,
        ...STAMMER.omlydStamme,
        ...STAMMER.ogsåKjentStamme,
        ...STAMMER.ogsåKjentOgForenkla,
        ...STAMMER.delAvTittel,
        ...STAMMER.delAvTittelOgForenkla
    ]
    .map(escapeRegex)
    .sort((a, b) => b.length - a.length) //test lengste først
    .join("|");

    const endingPattern = ENDINGAR
        .sort((a, b) => b.length - a.length)
        .join("|");

    const regex = new RegExp(
        `(${stemPattern})` +
        `(${endingPattern})?` +
        `([a-zæøå]+)?`,
        "gi"
    );

    function byggIndeksKart(original) {
        const kart = [];
        let normIndex = 0;

        for (let i = 0; i < original.length; i++) {
            if (original[i] !== "-") {
                kart[normIndex++] = i;
            }
        }
        return kart;
    }

    const indeksKart = byggIndeksKart(tekst);
    const normalTekst = fjernBindestrek(tekst);

    let resultat = tekst;
    const endringar = [];

    let sisteTittelPos = 0; //handterer rekkefølga til å slå saman [del av tittel]
    let sisteDelAvEnd = -1;
    let sisteVarDelAv = false;

    function velPos(stemLower, start, normalTekst){
        const key = STEM_POSKEY.get(stemLower) ?? stemLower;
        const posList = DEL_POS.get(key) || [];
        if (posList.length === 0) return 0;

        const continuing = //sjekk om vi har etterfølgande delAvTittel
        sisteVarDelAv && 
        sisteDelAvEnd >= 0 &&
        /^[\s\-]*$/.test(normalTekst.slice(sisteDelAvEnd, start));

        if (!continuing){ //byrje frå starten
            sisteTittelPos = 0;
        }

        const next = posList.find(p => p > sisteTittelPos);
        const chosen = next ?? posList[0];

        sisteTittelPos = chosen;
        return chosen;
    }

    function erKortTittelStemMedKortEnding(stem, ending, stemType) { //berre sensurer ved eksakt treff, eller når endinga er lengre enn to bokstavar
        const erTittelStem =
            stemType === "normalStamme" ||
            stemType === "delAvTittel" ||
            stemType === "delAvTittelOgForenkla";

        if (!erTittelStem) return false;

        const stemKort = fjernBindestrek(stem);

        return stemKort.length <= 2 && ending && ending.length <= 2; //minst tre lang stem eller tre lang ending
    }

    normalTekst.replace(regex, (full, stem, ending = "", rest = "", offset, whole) => {
        
        const stemType = STEM_INFO.get(stem.toLowerCase());

        if (ending && rest && stemType !== "delAvTittel" && ENDINGAR.includes(rest.toLowerCase())){ //sjekk om dobbeltending, og sett den andre som den ekte endinga (ikkje for del av tittel, som då ikkje skal sensurerast)
            stem = stem + ending;
            ending = rest;
            rest = "";
        }
        if (!ending && stem.slice(-1) === "e" && rest === "n" && stem.length > 2){ //tar med n her heller enn i endingslista fordi då gjeld det berre om n står aleine, ikkje i samansette (stem må vere over to så t.d. "de" ikkje sensurerer "den")
            stem = stem.slice(0, -1);//ein mindre
            ending = "en";
            rest = "";
        }
        
        const KONSONANTAR = "bcdfghjklmnpqrstvwxz";

        if (stemType === "forenklaKonsonant" || stemType === "ogsåKjentOgForenkla" || stemType === "delAvTittelOgForenkla"){
            if (!ending || !KONSONANTAR.includes(ending[0].toLowerCase())) {
                return; // ignorer match for forenkla konsonant-stem der endinga byrjar på vokal 
            }
        }

        const teiknFøre = offset > 0 ? whole[offset - 1] : "";
        const erFøre = /[a-zæøå]/i.test(teiknFøre);
        const erEtter = Boolean(rest);

        if (erKortTittelStemMedKortEnding(stem, ending, stemType)) {
            return;
        }

        if (stem.length < 4 && (erFøre || erEtter)) { //unngå å tru at korte stammer er del av samansette ord
            return;
        }

        if (stemType !== "delAvTittel" && stemType !== "delAvTittelOgForenkla") { //reset ordposisjonen til null
            sisteVarDelAv = false;
        }

        const start = indeksKart[offset];
        const end = indeksKart[offset + full.length - 1] + 1;

        const baseLengde = stem.length + (ending ? ending.length : 0);
        const baseSlutt =
            indeksKart[offset + baseLengde - 1] + 1;

        const originalRest = tekst.slice(baseSlutt, end);

        let erstatning;

        if (stemType === "delAvTittel" || stemType === "delAvTittelOgForenkla"){
            if (!erFøre && !erEtter){
                const pos = velPos(stem.toLowerCase(), offset, normalTekst);
                erstatning = `[del av tittel§${pos}]`;
                
                sisteVarDelAv = true;
                sisteDelAvEnd = offset + full.length;
            } else {
                erstatning = tekst.slice(start, end);
                
                sisteVarDelAv = false;
            }
            erstatning = kapitaliserSensuren(erstatning, tekst, start, end);
            endringar.push({ start, end, erstatning });
            return;
        }
        if (stemType === "ogsåKjentStamme" || stemType === "ogsåKjentOgForenkla"){
            if (erEtter){
                erstatning = `[også kjent som]${ending}${originalRest}`;
            } else {
                erstatning = `[også kjent som]`;
            }
        }
        else if (erEtter && (stem + ending) === normalTittel.toLowerCase()){ //eksakt tittelmatch i samansett
            erstatning = `[…]${originalRest}`;
        }
        else if (erEtter) { //samansett ord
            if (stemType === "omlydStamme"){
                erstatning = `[variantform]${ending}${originalRest}`;
            }
            else{
                erstatning = `[…]${ending}${originalRest}`;
            }
        }
        else if (ending && full.toLowerCase() !== normalTittel.toLowerCase()) { //anna ending
            if (stemType === "omlydStamme"){
                erstatning = `[variantform]`;
            }
            else{
                erstatning = `[…${ending}]`;
            }
        }
        else{ //same ending, annan stem frå tittel
            if (stemType === "omlydStamme"){
                erstatning = `[variantform]`;
            }
            else{ //eksakt match
                erstatning = `[…]`;
            }
        }

        erstatning = kapitaliserSensuren(erstatning, tekst, start, end);
        endringar.push({ start, end, erstatning });
    });

    function slåSamanDelAvTittel(resultat, tittelLengde) {
        const runRe = /(?:\[(?:[Dd]el av tittel)§\d+\]\s+)+\[(?:[Dd]el av tittel)§\d+\]/g; //match etterfølgande markørar

        resultat = resultat.replace(runRe, (run) => {
            const cap = run.startsWith("[Del av tittel"); //beheld stor forbokstav
            const DEL = cap ? "Del av tittel" : "del av tittel";
            const VAR = cap ? "Variantform" : "variantform";

            const nums = [...run.matchAll(/\[(?:[Dd]el av tittel)§(\d+)\]/g)].map(m => Number(m[1]));
            const spaces = [...run.matchAll(/\](\s+)\[/g)].map(m => m[1]); // mellomrom mellom markørar

            let out = "";
            let i = 0;

            while (i < nums.length) {
                let j = i;

                while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++; //utvid når etterfølgande

                const startPos = nums[i];
                const endPos = nums[j];

                const dekkerHeileTittel = // om blokken er heile tittel i rekkefølge, gjer til [variantform]
                    startPos === 1 &&
                    endPos === tittelLengde &&
                    (endPos - startPos + 1) === tittelLengde;

                out += dekkerHeileTittel
                    ? `[${VAR}]`
                    : `[${DEL}§${endPos}]`; //kollaps til siste pos
                
                if (j + 1 < nums.length) out += spaces[j]; //sett inn att mellomromma
                i = j + 1;
            }

            return out;
        });

        return resultat.replace(/\[(Del av tittel|del av tittel)§\d+\]/g, "[$1]"); //fjernar gjenståande markørar
    }

    function erStorBokstav(ch){
        return /^[A-ZÆØÅ]$/.test(ch);
    }

    function erSetningsStart(original, startIndex){
        if (startIndex === 0) return true;

        let i = startIndex -1;

        if (!/\s/.test(original[i])) return false; //krev minst eitt mellomrom

        while (i >= 0 && /\s/.test(original[i])) i--;

        if (i < 0) return true; //start av tekst
        return /[.!?]/.test(original[i]);
    }

    function kapitaliserSensuren(erstatning, original, start, end){
        const labelRe = /^\[(del av tittel|også kjent som|variantform)(?=[\]§])/i;

        const m = erstatning.match(labelRe);
        if (!m) return erstatning;

        const originalMatch = original.slice(start, end);
        const firstChar = originalMatch[0];

        if (!firstChar || !erStorBokstav(firstChar)) return erstatning; //berre om erstattar kapitalisert ord først i ei setning
        if (!erSetningsStart(original, start)) return erstatning;

        const label = m[1];
        const cap = label.charAt(0).toUpperCase() + label.slice(1);
        return erstatning.replace(labelRe, `[${cap}`);
    }    

    endringar
        .sort((a, b) => b.start - a.start)
        .forEach(({ start, end, erstatning }) => {
            resultat =
                resultat.slice(0, start) +
                erstatning +
                resultat.slice(end);
        });

    if (tittelOrd.length > 1){
        resultat = slåSamanDelAvTittel(resultat, tittelOrd.length);
    }

    return resultat;
}

function lagEkvivalentar(tittel){ //brukt for bøyingar som er aksepterte gjett
    const t = tittel.toLowerCase();

    const bindestrekVariantar = [
        t,
        t.replace(/-/g, ""),
        t.replace(/-/g, " "),
    ];

    const former = new Set();

    for (const v of bindestrekVariantar){
        const stem = finnStamme(v);
        former.add(v);
        former.add(stem);
        for (const end of ENDINGAR) {
            former.add(stem + end); //legg til alle endingane som godkjente alternativ
            former.add(v + end); //gjer det same for heile ordet (i fall stem blir noko rart)
        }
    }
    return former;
}

function visSetningar(tekst, antal) { //trur eg alltid må passe innerHTML til denne
    const ABBREV_RE = //forkortingar som ikkje kan avslutte setningar
    /(?:^|[\s(\["'«“])(?:ca|dvs|jf|mtp|pga|nr|n|num|st|st\.meld|st\.prp|meld|prop|tlf|t\.o\.m|vs|dr|mr|mrs|ms|hr|h\.m|prof|inkl|obs|kl|ch|aa)\.$/i;

    function erStorBokstav(ch) {
        return ch != null && /^[^a-zæøå&%§]$/.test(ch); //noko som ikkje er liten bokstav eller & % §
    }

    function erForkorting(s, dotIndex) { //forkortingar
        if (s[dotIndex] !== ".") return false;
        const start = Math.max(0, dotIndex - 30);
        const before = s.slice(start, dotIndex + 1);
        return ABBREV_RE.test(before);
    }

    function erInitial(s, dotIndex) { //initialer
        if (s[dotIndex] !== ".") return false;
        if (dotIndex === 0) return false;

        const prev = s[dotIndex - 1];
        if (!/[A-ZÆØÅ]/.test(prev)) return false; //før punktum må vere stor bokstav

        const prev2 = dotIndex >= 2 ? s[dotIndex - 2] : "";
        if (prev2 && /[A-Za-zÆØÅæøå]/.test(prev2)) return false; //to før punktum må vere noko anna enn bokstav

        return true;
    }

    function erOrdenstal(s, dotIndex) {
        if (s[dotIndex] !== ".") return false;

        let j = dotIndex - 1; //to siffer bakover
        if (j < 0 || !/\d/.test(s[j])) return false;

        let start = j;
        while (start - 1 >= 0 && /\d/.test(s[start - 1])) start--;

        const numStr = s.slice(start, dotIndex);
        if (!/^\d{1,2}$/.test(numStr)) return false;

        const n = Number(numStr);
        if (!(n >= 1 && n <= 12)) return false;

        const prev = start - 1 >= 0 ? s[start - 1] : "";
        if (prev && /[0-9A-Za-zÆØÅæøå]/.test(prev)) return false; //ikkje siffer eller tal rett før ordenstalet

        return true;
    }

    const setningar = [];
    let start = 0;
    let fannSetningsslutt = false;

    for (let i = 0; i < tekst.length; i++) {
        const ch = tekst[i];
        if (ch !== "." && ch !== "!" && ch !== "?") continue;

        let j = i + 1; //punktum pluss mellomrom pluss stor bokstav
        if (j >= tekst.length || !/\s/.test(tekst[j])) continue;
        while (j < tekst.length && /\s/.test(tekst[j])) j++;
        if (j >= tekst.length || !erStorBokstav(tekst[j])) continue;

        if (ch === "." && erForkorting(tekst, i)) continue; //veto forkorting
        if (ch === "." && erInitial(tekst, i)) continue; //veto initial
        if (ch === "." && erOrdenstal(tekst, i)) continue; //veto ordenstal

        const sentence = tekst.slice(start, j).trim(); 
        if (sentence){
            setningar.push(sentence);
            fannSetningsslutt = true;
        }

        if (setningar.length >= antal) break;
        start = j;
        i = j - 1;
    }

    if (!fannSetningsslutt) return "Feil: Fann ingen setningar.";
    return setningar.slice(0, antal).join(" ");
}

function hashString(str) {
    let h = 2166136261; //32bit Fowler–Noll–Vo hash function

    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }

    return h >>> 0;
}

function mulberry32(seed) { //deterministisk seed
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function lagArtikkelSeed(forsøk = 0) { //1. artikkel: dato + 0; 2. artikkel: dato + 1000 osv.
    const offset = artikkelNummerIDag * 1000 + forsøk;
    return `${hentDato()}_${offset}`;
}

function velVektaArtikkel(liste, tilfeldigTal, streak = 0) {
    const l = liste.length;
    const likVekt = 1 / l;

    const vekter = liste.map((_, index) => {
        const n = index + 1;

        const o = 1 / (n + 5); //originalvekt med streak=0

        return (o + streak * likVekt) / (streak + 1); //gradvis mot lik vekting
    });

    const totalVekt = vekter.reduce((sum, vekt) => sum + vekt, 0);

    let terskel = tilfeldigTal * totalVekt;

    for (let i = 0; i < liste.length; i++) {
        terskel -= vekter[i];

        if (terskel <= 0) {
            return liste[i];
        }
    }

    return liste[liste.length - 1]; //fallback
}

function bytArtikkel(forsøk = 0){ //tilfeldig artikkel etter seed
    let tilfeldigTal;

    if (deterministisk) {
        const seed = lagArtikkelSeed(forsøk);
        const rand = mulberry32(hashString(seed));
        tilfeldigTal = rand();
    } else {
        tilfeldigTal = Math.random();
    }

    artikkelnamn = velVektaArtikkel(aListe, tilfeldigTal, streak);

    fullArtikkelTekstSensurert = null;
    fullArtikkelTekstUsensurert = null;
}

function skalHoppeOverOrd(artikkelnamn) {
    const tittel = vaskArtikkelnamn(artikkelnamn);
    return /\bi Norge\b|\bi Noreg\b|\bNorges\b|historie/.test(tittel); //historie trigger også om det er del av samansett
}

function skalHoppeOverLangTittel(artikkelnamn) {
    const tittel = vaskArtikkelnamn(artikkelnamn);

    const m = tittel.match(/^\s*([^\s])/); //finn første bokstav
    if (!m) return false;

    const firstChar = m[1];
    const startarMedStor = /[A-ZÆØÅ]/.test(firstChar);

    const words = (tittel.match(/[0-9a-zæøå]+(?:-[0-9a-zæøå]+)*/gi) || []);
    const wordCount = words.length; //tell ord

    return startarMedStor && wordCount >= 4; //hopp over om 4+ ord og stor forbokstav
}

function harTittelTidleg(plainText, artikkelnamn) {
    const title = vaskArtikkelnamn(artikkelnamn);

    const m = plainText.match(/^\s*([^\s])/); //finn første bokstav
    if (!m) return false;

    const firstChar = m[1];

    if (/[a-zæøå]/.test(firstChar)) return true; //byrjar med er/var/betyr/komma

    const tok = (s) => (s.match(/[0-9a-zæøå]+(?:-[0-9a-zæøå]+)*/gi) || []).map(x => x.toLowerCase()); //separer til ord

    const textWords = tok(plainText);
    const titleWords = tok(title);
    if (titleWords.length === 0 || textWords.length < titleWords.length) return false;

    function matchAt(wordIndex) {
        for (let k = 0; k < titleWords.length; k++) {
            if (textWords[wordIndex + k] !== titleWords[k]) return false;
        }
        return true;
    }

    return matchAt(0) || matchAt(1); //tittel må vere første eller andre ord
}

function harTekstbrot(html) { //sjekkar om det kjem tittel, punktliste e.l. i dei første tre setningane
    if (!html) return false;

    const container = document.createElement("div");
    container.innerHTML = html;

    //tags som ikkje er lov
    const FORBOD = new Set(["H1", "H2", "H3", "UL", "OL", "DL", "BLOCKQUOTE", "TABLE"]);

    //er lov
    const SEPARATOR_TAGS = new Set(["P", "BR", "DIV"]);

    const ABBREV_RE = //forkortingar som ikkje avsluttar ei setning
        /(?:^|[\s(\["'«“])(?:ca|dvs|jf|mtp|pga|nr|n|num|st|st\.meld|st\.prp|meld|prop|tlf|t\.o\.m|vs|dr|mr|mrs|ms|hr|h\.m|prof|inkl|obs|kl|per|art|ch|aa)\.$/i;

    function erStorBokstav(ch) {
        return ch != null && /^[^a-zæøå&%§]$/.test(ch); //alt som ikkje er stor bokstav eller & % §
    }

    function erForkorting(s, dotIndex) {
        if (s[dotIndex] !== ".") return false;
        const start = Math.max(0, dotIndex - 30);
        const before = s.slice(start, dotIndex + 1);
        return ABBREV_RE.test(before);
    }

    function erInitial(s, dotIndex) {
        if (s[dotIndex] !== ".") return false;
        if (dotIndex === 0) return false;

        const prev = s[dotIndex - 1];
        if (!/[A-ZÆØÅ]/.test(prev)) return false;

        const prev2 = dotIndex >= 2 ? s[dotIndex - 2] : "";
        if (prev2 && /[A-Za-zÆØÅæøå]/.test(prev2)) return false;

        return true;
    }

    function erOrdenstal(s, dotIndex) {
        if (s[dotIndex] !== ".") return false;

        let j = dotIndex - 1;
        if (j < 0 || !/\d/.test(s[j])) return false;

        let start = j;
        while (start - 1 >= 0 && /\d/.test(s[start - 1])) start--;

        const numStr = s.slice(start, dotIndex);
        if (!/^\d{1,2}$/.test(numStr)) return false;

        const n = Number(numStr);
        if (!(n >= 1 && n <= 12)) return false;

        const prev = start - 1 >= 0 ? s[start - 1] : "";
        if (prev && /[0-9A-Za-zÆØÅæøå]/.test(prev)) return false;

        return true;
    }

    function telSetningar(tekst, maks) {
        let start = 0;
        let count = 0;

        for (let i = 0; i < tekst.length; i++) {
            const ch = tekst[i];
            if (ch !== "." && ch !== "!" && ch !== "?") continue;

            let j = i + 1;

            if (j < tekst.length && /\s/.test(tekst[j])){ //for punktum + mellomrom + start på ny setning
                while (j < tekst.length && /\s/.test(tekst[j])) j++;

                if (j < tekst.length && erStorBokstav(tekst[j])) {
                    if (ch === "." && erForkorting(tekst, i)) continue;
                    if (ch === "." && erInitial(tekst, i)) continue;
                    if (ch === "." && erOrdenstal(tekst, i)) continue;

                    const sentence = tekst.slice(start, j).trim();
                    if (sentence) count++;

                    if (count >= maks) return count;

                    start = j;
                    i = j - 1;
                    continue;
                }
            }

            const restEtter = tekst.slice(i + 1).trim(); //tel også siste setning om teksten sluttar her
            if (restEtter === "") {
                if (ch === "." && erForkorting(tekst, i)) continue;
                if (ch === "." && erInitial(tekst, i)) continue;
                if (ch === "." && erOrdenstal(tekst, i)) continue;

                const sentence = tekst.slice(start, i + 1).trim();
                if (sentence) count++;

                if (count >= maks) return count;
            }
        }

        return count;
    }

    let acc = ""; //vi kan stoppe å lese etter 3 setningar eller eit ulovleg element

    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
    );

    while (walker.nextNode()) {
        const node = walker.currentNode;

        if (telSetningar(acc, 3) >= 3) return false;

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName;

            if (FORBOD.has(tag)){
                return true; //ulovleg tag -> avvis
            } 

            if (SEPARATOR_TAGS.has(tag)) { //lovlege separatorer gir mellomrom om det hjelper med å halde orda frå kvarandre
                if (acc && !/\s$/.test(acc)) acc += " ";
            }

            continue;
        }

        if (node.nodeType === Node.TEXT_NODE) { //veit ikkje kva dette gjer
            const text = node.nodeValue || "";
            const normalized = text.replace(/\u00A0/g, " ");
            acc += normalized;

            if (telSetningar(acc, 3) >= 3) return false;
        }
    }

    return true; //om heile teksten er under 3 setningar, reknast han som om han har tekstbrot
}

function likskap(s1, s2){ //sjekk kor like to strings er
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    if (longer.length == 0){ //to tomme strings
        return 1.0;
    }
    return (longer.length - editDistance(longer, shorter)) / longer.length;
}

function erNamn(tittel){ //funkar ikkje for van Gogh o.l., men pytt pytt
    const fleireSærnamn = /\s[A-ZÆØÅ]/; //mellomrom + stor bokstav (påkravd)
    const andreOrd = /\s[^A-ZÆØÅ]/; //mellomrom + liten bokstav (eller tal) (diskvalifiserande)
    const storForbokstav = /^[A-ZÆØÅ]/; //første bokstav stor (påkravd)
    if (!fleireSærnamn.test(tittel) || andreOrd.test(tittel) || !storForbokstav.test(tittel)){ //er ikkje namn om det manglar 2+ særnamn (stor bokstav) eller det er andre ord (liten bokstav)
        return false;
    } else{
        return true;
    }
}

function harEtternamn(gjett, tittel){
    const etternamn = tittel.trim().split(" ").pop().toLowerCase(); //siste ord
    const namnInkludert = gjett.split(" "); //alle enkeltorda i gjettet
    return namnInkludert.includes(etternamn); //sann om gjettet inkluderer etternmanen, usann om ikkje
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
        costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

function vent(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function velArtikkel(maxForsøk = 200) {
    for (let forsøk = 0; forsøk < maxForsøk; forsøk++) {
        bytArtikkel(forsøk); //vel ny kandidat

        if (skalHoppeOverOrd(artikkelnamn)) continue; //kan ikkje ha ord som ofte er i tematiske titlar
        if (skalHoppeOverLangTittel(artikkelnamn)) continue; //må vere under fire ord eller ha liten forbokstav

        try {
            const response = await fetch(`https://snl.no/${artikkelnamn}.json`);
            if (!response.ok) continue;

            const data = await response.json();

            //if (data?.license_name !== "fri") continue; //ha med denne om eg finn ut at dette ikkje gjeld som sitering, men som gjenbruk

            const cleanedHtml = strippAltUnntattKursiv(data.xhtml_body || "");
            const tmp = document.createElement("div");
            tmp.innerHTML = cleanedHtml;
            const plainText = (tmp.textContent || "").replace(/\u00A0/g, " ").trim();

            if (!harTittelTidleg(plainText, artikkelnamn)) continue; //må ha tittel som første eller andre ord
            if (harTekstbrot(data.xhtml_body)) continue;

            if (deterministisk) {
                artikkelNummerIDag++; //berre auk når vi faktisk har funne ein gyldig artikkel
                //lagreArtikkelrekke(); //veit ikkje korfor eg har kommentert denne ut, men no tør eg ikkje ha han med
            }

            return data; //suksess
        } catch {
            //ignorer og prøv igjen
            continue;
        }
    }
    throw new Error("Fann ingen artiklar etter mange forsøk.");
}

let runde = 1;
let ferdigGjetta = false;
let streak = 0;
let daglegFramgang = 0;
let besteStreak = Number(localStorage.getItem("besteStreak")) || 0;
let besteStreakFørRun = besteStreak;
let daglegStreak = Number(localStorage.getItem("daglegStreak")) || 0;
let besteDaglegeStreak = Number(localStorage.getItem("besteDaglegeStreak")) || 0;
let daglegResultat = localStorage.getItem("daglegResultat") || "";
let daglegDato = localStorage.getItem("daglegDato") || "";
let daglegFerdig = localStorage.getItem("daglegFerdig") === "true";
let artikkelNummerIDag = Number(localStorage.getItem("artikkelNummerIDag")) || 0;
let deterministisk = localStorage.getItem("deterministisk") !== "false";
let vellykkaSkips = 0;

const SKIP_SJANSELISTE = [50, 40, 30, 25, 20, 15, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

function lagreStreak(){
    localStorage.setItem("besteStreak", String(besteStreak));
}

function oppdaterStreak(){
    const streakEl = document.getElementById("streak");
    const besteStreakEl = document.getElementById("besteStreak");

    if (streak < 10){
        streakEl.textContent = `${streak} på rad`;
    } else{
        streakEl.textContent = `${streak} på rad!`;
    }

    besteStreakEl.textContent = `${besteStreak} er rekorden din`;
}

function oppdaterOgLagreStreak(){
    if (streak > besteStreak){
        besteStreak = streak;
    }
    lagreStreak();
    oppdaterStreak();
}

function hentDato() {
    const no = new Date();
    const year = no.getFullYear();
    const month = String(no.getMonth() + 1).padStart(2, "0");
    const day = String(no.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formaterDatoNorsk(datoStr) {
    const [år, månad, dag] = datoStr.split("-").map(Number);

    const månadsnamn = [
        "januar",
        "februar",
        "mars",
        "april",
        "mai",
        "juni",
        "juli",
        "august",
        "september",
        "oktober",
        "november",
        "desember"
    ];

    return `${dag}. ${månadsnamn[månad - 1]} ${år}`;
}

function dagarMellom(d1, d2) {
    const a = new Date(d1 + "T00:00:00");
    const b = new Date(d2 + "T00:00:00");
    return Math.floor((b - a) / 86400000);
}

function lagreArtikkelrekke() {
    localStorage.setItem("artikkelNummerIDag", String(artikkelNummerIDag));
    localStorage.setItem("deterministisk", String(deterministisk));
}

function lagreDaglegStreak() {
    localStorage.setItem("daglegStreak", String(daglegStreak));
    localStorage.setItem("daglegResultat", daglegResultat);
    localStorage.setItem("daglegDato", daglegDato);
    localStorage.setItem("daglegFerdig", String(daglegFerdig));
}

function hentDaglegMål() {
    return daglegStreak + 1;
}

function oppdaterDaglegVisning() {
    const streakEl = document.getElementById("daglegStreak");
    const statusEl = document.getElementById("daglegStatus");
    const lengsteEl = document.getElementById("besteDaglegeStreak");
    const daglegMeldingEl = document.getElementById("resultatDaglegStreak");

    if (streakEl) {
        streakEl.textContent = `${daglegStreak} lang dagleg sigersrekke`;
    }

    if (statusEl) {
        if (daglegFerdig && daglegDato === hentDato()) {
            if (daglegResultat === "suksess") {
                statusEl.textContent = ""; //Ser betre ut med ingenting enn ✓ her
                daglegMeldingEl.textContent = "Du klarte å auke den daglege sigersrekka di!";
                daglegMeldingEl.hidden = false;
            } else if (daglegResultat === "tap") {
                statusEl.textContent = "✕";
                daglegMeldingEl.textContent = "Du mista den daglege sigersrekka di";
                daglegMeldingEl.hidden = false;
            } else {
                statusEl.textContent = "";
            }
        } else {
            statusEl.textContent = `(${daglegFramgang}/${hentDaglegMål()} i dag)`;
        }
    }

    if (lengsteEl) {
        lengsteEl.textContent = String(besteDaglegeStreak);
    }
}

function initDaglegStreak() {
    const iDag = hentDato();

    if (daglegDato) {
        const gap = dagarMellom(daglegDato, iDag);

        if (gap > 1) {
            daglegStreak = 0;
            daglegFerdig = false;
        }
    }

    if (daglegDato !== iDag) {
        daglegDato = iDag;
        daglegFerdig = false;
        daglegResultat = "";
        artikkelNummerIDag = 0;
        deterministisk = true;
        lagreArtikkelrekke();
    }

    lagreDaglegStreak();
    oppdaterDaglegVisning();
}

function registrerDaglegResultat(suksess) {
    const iDag = hentDato();

    if (daglegDato !== iDag) {
        initDaglegStreak();
    }

    if (daglegFerdig) return;

    const mål = hentDaglegMål();

    if (suksess) {
        daglegFramgang++;

        if (daglegFramgang >= mål) {
            daglegStreak++;
            if (daglegStreak > besteDaglegeStreak) {
                besteDaglegeStreak = daglegStreak;
                localStorage.setItem("besteDaglegeStreak", String(besteDaglegeStreak));
            }
            daglegFramgang = 0;
            daglegFerdig = true;
            daglegResultat = "suksess";
        }
    } else {
        daglegStreak = 0;
        daglegFramgang = 0;
        daglegFerdig = true;
        daglegResultat = "tap";
    }

    lagreDaglegStreak();
    oppdaterDaglegVisning();
}

function hentSkipSjanse() {
    const indeks = Math.min(vellykkaSkips, SKIP_SJANSELISTE.length - 1);
    return SKIP_SJANSELISTE[indeks];
}

function oppdaterSkipKnapp(){
    const skipKnapp = document.getElementById("skipKnapp");
    if (!skipKnapp) return;

    const skalVisast = !ferdigGjetta && runde === 1;
    skipKnapp.hidden = !skalVisast;

    if (!skalVisast) return;

    skipKnapp.textContent = `Hopp over (${hentSkipSjanse()}% sjanse) ➔`;
}

async function prøvHoppOver(opnaMedTast = false){
    if (runde !== 1 || ferdigGjetta) return;

    const sjanse = hentSkipSjanse();
    const lykkast = Math.random() <= sjanse / 100;

    if (lykkast){
        vellykkaSkips++;
        streak++;
        oppdaterOgLagreStreak();
        registrerDaglegResultat(true);
        await nyArtikkel();
    } else {
        vellykkaSkips = 0;
        await feilGjett("Klarte ikkje å hoppe over", opnaMedTast, true);
        await visResultat(false, "", opnaMedTast);
    }
}

function daglegStreakTooltipHTML() {
    return `<span class="toolTip popupToolTip"><button class="toolTipTrigger" type="button" aria-expanded="false" aria-label="Kva er dagleg sigersrekke?">?</button><span class="toolTipBoks" role="tooltip">
        For å halde på sigersrekka di må du kvar dag få fleire på rad enn sigersrekka er lang. Dette må du få til på første forsøk. Det vil seie at første dag må du få minst éin rett i dagens ordrekke, andre dag minst to rett og så vidare. Om du ikkje klarar dette, går sigersrekka ned att til null.<br>
        Den lengste daglege sigersrekka di nokosinne er <span id="besteDaglegeStreakPopup">0</span>.
    </span></span>`;
}

async function visResultat(suksess = false, gjettaOKS = "", popupOpnaMedTast = false){
    viserResultat = true;
    gjettefelt.disabled = true;
    gjettefelt.blur();
    gjettefelt. value = "";
    nullstillHøgde();
    const streakFørResultat = streak;
    const rekordFørRun = besteStreakFørRun;
    const sloRekord = streakFørResultat > rekordFørRun;
    const tangerteRekord = streakFørResultat === rekordFørRun && rekordFørRun > 0;
    registrerDaglegResultat(suksess);
    const usensurertTekst = await fetchArtikkel(false);
    ingress.innerHTML = visSetningar(usensurertTekst, 3); //vis usensurert ingress
    document.getElementById("hint").hidden = true; //gøym hintet
    gjettefelt.hidden = true; //gøym gjettefeltet
    document.getElementById("skipKnapp"). hidden = true;
    document.getElementById("varsel").hidden = true; //gøym "Eitt forsøk att!"
    oppslagsord.textContent = vaskArtikkelnamn(artikkelnamn); //vis fasit (ser ut som det gamle gjettefeltet)
    oppslagsord.hidden = false;
    document.getElementById("tilfeldigArtikkel").disabled = true; //"Neste oppslagsord" kjem opp, men ikkje klikkbar
    if (suksess){
        streak++;
        document.getElementById("tilfeldigArtikkel").textContent = "Gjett neste oppslagsord ⏎";
        if (gjettaOKS){
            document.getElementById("korrekt").innerHTML = "<em>" + giStorForbokstav(vaskArtikkelnamn(artikkelnamn)) + "</em>, også kjent som <em>" + gjettaOKS + "</em>, er korrekt!";
            document.getElementById("korrekt").hidden = false;
        } else{
            document.getElementById("korrekt").innerHTML = "<em>" + giStorForbokstav(vaskArtikkelnamn(artikkelnamn)) + "</em> er korrekt!";
            document.getElementById("korrekt").hidden = false;
        }
        if (rekordFørRun !== 0 && (streak - rekordFørRun) === 1){ //berre når streaken kjem éin over den gamle rekorden
            document.getElementById("nyRekord").hidden = false;
        }
    } else{
        const popupTekst = document.getElementById("popupTekst");
        if (deterministisk){
            popupTekst.innerHTML = `Du tapte etter å ha fått ${streakFørResultat} på rad i dagens ordrekke (${formaterDatoNorsk(hentDato())}). Dagens ordrekke er lik for alle. Om du ikkje vil vente til neste dag, kan du gå vidare til frispeling med tilfeldige artiklar. Frispeling påverkar ikkje den daglege sigersrekka,` +
            daglegStreakTooltipHTML() +
            ` men du kan framleis slå rekorden din for lengste rekke ord gjetta.`;
            document.getElementById("besteDaglegeStreakPopup").textContent = besteDaglegeStreak;
        } else if (sloRekord){
            const rekordTekst =
                rekordFørRun === 0
                    ? ""
                    : ` Det er ny rekord! Den gamle rekorden din var ${rekordFørRun}. Gratulerer!`;
            popupTekst.textContent = `Du tapte etter å ha fått ${streakFørResultat} på rad.${rekordTekst}`;
        } else if (tangerteRekord){
            popupTekst.textContent = `Du tapte etter å ha fått ${streakFørResultat} på rad. Det er likt med rekorden din! Klarar du å slå han?`;
        } else{
            const unnaRekord = Math.max(0, rekordFørRun - streakFørResultat);
            popupTekst.textContent = `Du tapte etter å ha fått ${streakFørResultat} på rad. Det er ${unnaRekord} unna rekorden din. Klarar du betre?`;
        }
        streak = 0;
        if (deterministisk){
            document.getElementById("tilfeldigArtikkel").textContent = "Prøv ei tilfeldig ordrekke ⏎";
        } else{
            document.getElementById("tilfeldigArtikkel").textContent = "Prøv igjen ⏎";
        }
        deterministisk = false;
        lagreArtikkelrekke();
    }
    oppdaterOgLagreStreak();
    document.getElementById("tilfeldigArtikkel").hidden = false;
    document.getElementById("skrivenAv").textContent = "Skriven av: " + formaterForfattarar(artikkelData.authors);
    document.getElementById("skrivenAv").hidden = false;
    document.getElementById("lesHeile").href = `https://www.snl.no/${artikkelnamn}`;
    document.getElementById("lesHeile").hidden = false;
    if (!suksess) {
        visTapPopup(popupOpnaMedTast);
    }
    await vent(1500); //vent halvtanna sekund før ein kan trykke enter
    document.getElementById("tilfeldigArtikkel").disabled = false;
    ferdigGjetta = true;
}

async function feilGjett(gjett, opnaMedTast = false, prøvdeHoppe = false){
    const tekst = await fetchArtikkel();
    runde = runde + 1;
    oppdaterSkipKnapp();
    gjettefelt.value = "";
    nullstillHøgde();
    mobilSendKnapp.hidden = true;
    if (runde < 4){ //fleire gjett att
        ingressMeta = await byggOrdgrense();
        ingressTemplateHTMLRaw = visSetningar(tekst, runde); //lagre før dekorasjon
        ingressTemplateDecorated = dekorerSensur(ingressTemplateHTMLRaw, ingressMeta);
        ingress.innerHTML = ingressTemplateDecorated;
        if (prøvdeHoppe){
            spelLyd(storFeilLyd);
        } else{
            spelLyd(litenFeilLyd);
        }        
        if (runde === 2){ //vis første gjett
            document.getElementById("førsteGjett").textContent = gjett + " ✕";
            document.getElementById("førsteGjett").hidden = false;
        } else if (runde === 3){ //vis andre gjett
            document.getElementById("andreGjett").textContent = gjett + " ✕";
            document.getElementById("andreGjett").hidden = false;
            document.getElementById("varsel").textContent = "Eitt forsøk att!";
            document.getElementById("varsel").hidden = false;
            oppdaterPlaceholder();
        }
    } else{ //tap
        document.getElementById("tredjeGjett").textContent = gjett + " ✕"; //vis siste gjett
        document.getElementById("tredjeGjett").hidden = false;
        vellykkaSkips = 0;
        visResultat(false, "", opnaMedTast);
        spelLyd(storFeilLyd);
    }
}

async function rettGjett(gjettaOKS){
    gjettefelt.value = "";
    nullstillHøgde();
    mobilSendKnapp.hidden = true;
    gjettaNesten = false;
    visResultat(true, gjettaOKS);
    spelLyd(vinnLyd);
}

let hentarNyArtikkel = false; //så den ikkje skal fyre av dobbelt

async function nyArtikkel(){
    if (hentarNyArtikkel) return;
    hentarNyArtikkel = true;

    try {
        viserResultat = false;
        ferdigGjetta = false;
        runde = 1;
        brukarHarTryktIGjettefelt = false;
        gjettefelt.disabled = false;
        gjettefelt.value = "";
        nullstillHøgde();
        if (streak === 0) {
            besteStreakFørRun = besteStreak;
        }
        oppdaterPlaceholder();
        document.getElementById("resultatDaglegStreak").hidden = true;
        fullArtikkelTekstSensurert = null;
        fullArtikkelTekstUsensurert = null;
        artikkelData = null;
        ingressMeta = await byggOrdgrense();
        ingressTemplateHTMLRaw = visSetningar(await fetchArtikkel(), 1);
        ingressTemplateDecorated = dekorerSensur(ingressTemplateHTMLRaw, ingressMeta);
        ingress.innerHTML = ingressTemplateDecorated;
        oppslagsord.hidden = true;
        mobilSendKnapp.hidden = true;
        gjettefelt.style.width = "";
        gjettefelt.hidden = false;
        document.getElementById("oks").hidden = true;
        document.getElementById("tilfeldigArtikkel").hidden = true;
        document.getElementById("skrivenAv").hidden = true;
        document.getElementById("lesHeile").hidden = true;
        if (!erMobil()){
            gjettefelt.focus();
        }
        oppdaterPlaceholder();
        document.getElementById("førsteGjett").hidden = true;
        document.getElementById("andreGjett").hidden = true;
        document.getElementById("tredjeGjett").hidden = true;
        document.getElementById("førsteGjett").textContent = ""; //så ein skal kunne gjette dette neste runde
        document.getElementById("andreGjett").textContent = "";
        document.getElementById("tredjeGjett").textContent = "";
        document.getElementById("korrekt").hidden = true;
        document.getElementById("nyRekord").hidden = true;
        oppdaterSkipKnapp();
    } finally {
        hentarNyArtikkel = false;
    }
}

const ingress = document.getElementById("ingress");
const oppslagsord = document.getElementById("oppslagsord");

document.getElementById("lesHeile") //for at ein skal kunne trykke enter etter å ha trykka på les meir og komme tilbake i fanen. Funkar ikkje alltid.
    .addEventListener("click", async () => {
        document.getElementById("tilfeldigArtikkel").focus();        
    });

window.addEventListener('click', function(event) {
    if (erMobil()) return;

    if (event.target.closest("button, a, input, textarea, select")) return;

    gjettefelt.focus();
});

document.getElementById("tilfeldigArtikkel")
    .addEventListener("click", async () => {
        await nyArtikkel();
    });

const gjettefelt = document.getElementById("gjettefelt");
const mobilQuery = window.matchMedia("(max-width: 1000px)");
const touchQuery = window.matchMedia("(pointer: coarse), (hover: none)"); //touchskjerm

function erMobil() {
    return mobilQuery.matches && touchQuery.matches;
}

let brukarHarTryktIGjettefelt = false;

function oppdaterPlaceholder() {
    if (runde === 3){
        gjettefelt.placeholder = "Hint: " + hintOmForbokstav(vaskArtikkelnamn(artikkelnamn));
        return;
    }

    if (!erMobil()){
        gjettefelt.placeholder = "Gjett oppslagsordet";
        return;
    }

    if (!brukarHarTryktIGjettefelt && gjettefelt.value.trim() === ""){
        gjettefelt.placeholder = "Klikk her for å gjette";
        return;
    }

    gjettefelt.placeholder = "Gjett oppslagsordet";
}

gjettefelt.addEventListener("pointerdown", () => {
    if (erMobil()) {
        brukarHarTryktIGjettefelt = true;
        oppdaterPlaceholder();
    }
});

gjettefelt.addEventListener("focus", () => {
    if (!erMobil()) {
        oppdaterPlaceholder();
    }
});

gjettefelt.addEventListener("blur", () => {
    if (erMobil() && gjettefelt.value.trim() === "") {
        brukarHarTryktIGjettefelt = false;
    }

    oppdaterPlaceholder();
});

gjettefelt.addEventListener("input", oppdaterPlaceholder);
mobilQuery.addEventListener("change", oppdaterPlaceholder);
touchQuery.addEventListener("change", oppdaterPlaceholder);

gjettefelt.addEventListener("blur", async () => {   
    if (viserResultat || gjettefelt.hidden || gjettefelt.disabled) return;
    
    if (erTabTrykt){
        erTabTrykt = false;
        return;
    }

    gjettefelt.focus();
    });

const tekstMålar = document.createElement("span")
tekstMålar.className = "tekstMålar";
document.body.appendChild(tekstMålar);

function nullstillHøgde(){
    const lineHeight = parseFloat(getComputedStyle(gjettefelt).lineHeight);
    gjettefelt.style.height = lineHeight + "px";
    gjettefelt.style.width = "100%";
}

function målTekstbreidde(tekst){
    tekstMålar.textContent = tekst || " ";
    return tekstMålar.getBoundingClientRect().width;
}

function gjerTextareaBreiddeTilTekst(el){
    const måltBreidde = målTekstbreidde(el.value);
    const parentBreidde = el.parentElement.getBoundingClientRect().width;

    el.style.width = Math.min(måltBreidde + 5, parentBreidde) + "px";
}

function textareaHarFleireLinjer(el){
    const linjeHøgde = parseFloat(getComputedStyle(el).lineHeight);
    return el.scrollHeight > linjeHøgde * 1.5;
}

function autoVeksTextarea(el){
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}

function tekstVilWrappe(el){
    const style = getComputedStyle(el);

    const paddingX =
        parseFloat(style.paddingLeft) +
        parseFloat(style.paddingRight);

    const usableWidth = el.clientWidth - paddingX;

    if (el.value.includes("\n")) return true; // Om brukaren limer inn linjeskift, må feltet kunne vekse

    return målTekstbreidde(el.value) > usableWidth;
}

function autoVeksTextareaBerreVedWrap(el){ //for å unngå små forskjellar mellom målt eilinjeshøgde og tomt felt
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);

    if (tekstVilWrappe(el)){
        autoVeksTextarea(el);
    } else{
        el.style.height = lineHeight + "px";
    }
}

function hintFårPlassPåSameLinje(textarea, hintText) {
    const rad = textarea.parentElement;

    const typedWidth = målTekstbreidde(textarea.value);
    const hintWidth = målTekstbreidde(hintText);

    const availableWidth = rad.getBoundingClientRect().width;

    return typedWidth + hintWidth + 8 <= availableWidth;
}

gjettefelt.addEventListener("input", (event) => {
    if (viserResultat || gjettefelt.disabled || gjettefelt.hidden){
        event.target.value = "";
        return;
    }

    let value = event.target.value;

    value = value.trimStart(); //kan ikkje starte med mellomrom
    value = value.replace(/\s{2,}/g, " "); //kan ikkje ha to mellomrom etter kvarandre

    event.target.value = value;

    if (runde === 3 && value !== ""){
        const hintTekst = dynamiskHint(vaskArtikkelnamn(artikkelnamn), value);

        gjerTextareaBreiddeTilTekst(gjettefelt); //gjer slik at hintet kjem rett bak
        autoVeksTextareaBerreVedWrap(gjettefelt);

        const harFleireLinjer = textareaHarFleireLinjer(gjettefelt);
        const hintHarPlass = hintFårPlassPåSameLinje(gjettefelt, hintTekst);

        if (harFleireLinjer || !hintHarPlass){
            document.getElementById("hint").hidden = true;
        } else{
            document.getElementById("hint").textContent = hintTekst
            document.getElementById("hint").hidden = false;
        }
    } else{
        document.getElementById("hint").hidden = true;
        gjettefelt.style.width = "100%";
        autoVeksTextareaBerreVedWrap(gjettefelt);
    }

    ingress.innerHTML = fyllInnSensurDekorert(ingressTemplateDecorated, value); //oppdater sensuren med det som skrivast (dekorert)

    mobilSendKnapp.hidden = !(erMobil() && value.trim() !== ""); //vis enterknapp om ikkje på mobil og noko i feltet
});

let gjettaNesten = false;

let erTabTrykt = false;

const mobilSendKnapp = document.getElementById("mobilSendKnapp");

async function sendGjett(opnaMedTast = false){
    if (viserResultat || gjettefelt.disabled || gjettefelt.hidden) return;

    const gjettOriginal = gjettefelt.value.trim().toLowerCase();
    const gjett = normaliserTilNorskEkvivalent(gjettOriginal);
    const gjettSamantrekt = gjett.replace(/-/g, ""); //variant der bindestrekord er trekt saman
    const gjettSplitta = gjett.replace(/-/g, " "); //variant der bindestrekord er splitta frå kvarandre
    const første = document.getElementById("førsteGjett").textContent.slice(0,-2).trim().toLowerCase();
    const andre = document.getElementById("andreGjett").textContent.slice(0,-2).trim().toLowerCase();
    const fasit = vaskArtikkelnamn(artikkelnamn);

    if (gjett === "" || gjett === første || gjett === andre){ //ikkje gyldig gjett (tom eller tidlegare gjett)
        if (gjett === første && gjett !== ""){ //rist gjettefeltet, hintet og første gjett
            gjettefelt.classList.add("rist");
            document.getElementById("hint").classList.add("rist")
            document.getElementById("førsteGjett").classList.add("rist")
            setTimeout(function(){
                gjettefelt.classList.remove("rist");
                document.getElementById("hint").classList.remove("rist")
                document.getElementById("førsteGjett").classList.remove("rist")
            }, 300);
        }
        if (gjett === andre && gjett !== ""){ //rist gjettefeltet, hintet og andre gjett
            gjettefelt.classList.add("rist");
            document.getElementById("hint").classList.add("rist")
            document.getElementById("andreGjett").classList.add("rist")
            setTimeout(function(){
                gjettefelt.classList.remove("rist");
                document.getElementById("hint").classList.remove("rist")
                document.getElementById("andreGjett").classList.remove("rist")
            }, 300);
        }
        return;
    }

    document.getElementById("nestenRett").hidden = true; //vi er no over i gyldig gjett -> skjul "nesten rett"

    const gyldigeBøyingarUnorm = lagEkvivalentar(fasit);
    const gyldigeBøyingar = new Set(
        [...gyldigeBøyingarUnorm].map(normaliserTilNorskEkvivalent)
    );

    if (gyldigeBøyingar.has(gjett) || gyldigeBøyingar.has(gjettSamantrekt) || gyldigeBøyingar.has(gjettSplitta) ){ // om nokre av bøyingane til fasiten er lik gjettet (ignorer bindestrek) -> rett
        rettGjett();
        return;
    }

    const ogsåKjentArray = hentOgsåKjentSom(artikkelData.metadata?.alternative_form);

    const formTilOriginalOKS = new Map();

    for (const oks of ogsåKjentArray) {
        for (const form of lagEkvivalentar(oks)) {
            const normalisertForm = normaliserTilNorskEkvivalent(form);
            if (!formTilOriginalOKS.has(normalisertForm)) {
                formTilOriginalOKS.set(normalisertForm, oks);
            }
        }
    }

    const treff =
        formTilOriginalOKS.get(gjett) ??
        formTilOriginalOKS.get(gjettSamantrekt) ??
        formTilOriginalOKS.get(gjettSplitta);

    if (treff){ // om nokre av bøyingane til eit av "også kjent som"-orda er lik gjettet -> rett
        const oksLista = visOgsåKjentSom(artikkelData.metadata?.alternative_form);
        document.getElementById("oks").innerHTML = `<b>OGSÅ KJENT SOM</b> ${oksLista}`;
        document.getElementById("oks").hidden = false;
        rettGjett(treff);
        return;
    }

    const namnePåheng = ["jr.", "sr.", "jr", "sr", "junior", "senior", "snr", "jnr", "sen.", "jun.", "sen", "jun", "den yngre", "den eldre", "d.y.", "d. y.", "d.e.", "d. e."]
    let fasitOrd = fasit.trim().split(" ");
    let namneFasit = fasit;
    const siste = fasitOrd.at(-1)?.toLowerCase(); //siste ord i fasiten
    
    if (namnePåheng.includes(siste)){ //siste ord er junior/senior
        fasitOrd.pop(); //fjernar junior/senior
        namneFasit = fasitOrd.join(" ");
    }

    if (erNamn(namneFasit) && harEtternamn(gjett, namneFasit)){ //godta å berre skrive etternamn for personar
        rettGjett();
        return;
    }

    const fasitNormalisert = normaliserTilNorskEkvivalent(fasit);

    if (!sluttarMedKongetal(fasit) && likskap(gjett, fasitNormalisert) > 0.7){ //over 70% rett -> gi beskjed om å prøve anna staving
        document.getElementById("nestenRett").hidden = false; //om ein prøver på nytt og framleis har nesten rett svar, ristar "nestenRett"
        if (gjettaNesten === true){
            document.getElementById("nestenRett").classList.add("rist");
            setTimeout(function(){
                document.getElementById("nestenRett").classList.remove("rist")
            }, 300);
        }
        gjettaNesten = true;
        return;
    }

    gjettaNesten = false;

    feilGjett(gjettefelt.value, true); //om ingen av dei over -> feil gjett
}


gjettefelt.addEventListener("keydown", async (event) => { //gjett (via enter) eller trykk tab for å komme seg ut

    if (event.key === 'Tab'){
        erTabTrykt = true;
    }

    if (event.key !== "Enter") return;

    event.preventDefault();

    if (viserResultat || gjettefelt.disabled || gjettefelt.hidden) return;

    await sendGjett(true);
});

mobilSendKnapp.addEventListener("click", async (event) => {
    event.stopPropagation();
    await sendGjett(false);
    gjettefelt.focus();
});

document.addEventListener("keydown", async (event) =>{ //enter key når ein har gjetta ferdig
    if (event.key !== "Enter") return;
    if (!ferdigGjetta) return;
    if (!document.getElementById("tapPopup").hidden) return;

    const active = document.activeElement;

    const isInteractive =
        active?.tagName === "BUTTON" ||
        active?.tagName === "A" ||
        active?.tagName === "INPUT" ||
        active?.tagName === "TEXTAREA";

    if (isInteractive) return; //om ein har fokus på ein av knappane (inkludert lesHeile, som eigentleg ikkje er ein knapp), klikker enter på den, ikkje ny artikkel

    await nyArtikkel();
});

document.addEventListener("click", (event) => {
    const button = event.target.closest(".toolTipTrigger");

    if (!button) return;

    event.stopPropagation();

    const tooltip = button.closest(".toolTip");
    const box = tooltip.querySelector(".toolTipBoks");

    const skalOpnast = !box.classList.contains("is-visible");

    document.querySelectorAll(".toolTipBoks").forEach((boks) => {
        boks.classList.remove("is-visible");
    });

    document.querySelectorAll(".toolTipTrigger").forEach((knapp) => {
        knapp.setAttribute("aria-expanded", "false");
    });

    if (!skalOpnast) return;

    if (tooltip.classList.contains("popupToolTip")) {
        plasserPopupTooltip(button, box);
    } else {
        box.classList.add("is-visible");
    }

    button.setAttribute("aria-expanded", "true");
});

document.addEventListener("click", (event) => {
    if (event.target.closest(".toolTip")) return;
    document.querySelectorAll(".toolTipBoks").forEach((box) => {
        box.classList.remove("is-visible");
    });
    document.querySelectorAll(".toolTipTrigger").forEach((button) => {
        button.setAttribute("aria-expanded", "false");
    });
});

document.getElementById("lukkTapPopup")
    .addEventListener("click", () => {
        lukkTapPopup();
    });

document.getElementById("tapPopup")
    .addEventListener("click", (event) => {
        if (event.target.id === "tapPopup") {
            lukkTapPopup();
        }
    });

document.addEventListener("keyup", () => {
    const popup = document.getElementById("tapPopup");

    if (popup.hidden) return;

    tapPopupKanLukkastMedTast = true;
});

document.addEventListener("keydown", (event) => {
    const popup = document.getElementById("tapPopup");

    if (popup.hidden) return;
    if (!tapPopupKanLukkastMedTast) return;

    event.preventDefault();
    lukkTapPopup();
});

let skipOpnaMedTast = false;

document.getElementById("skipKnapp")
    .addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            skipOpnaMedTast = true;
        }
    });

document.getElementById("skipKnapp")
    .addEventListener("click", async () => {
        await prøvHoppOver(skipOpnaMedTast);
        skipOpnaMedTast = false;
    });

function plasserPopupTooltip(button, box) {
    const margin = 16;
    const gap = 8;

    box.style.visibility = "hidden"; //må vere synleg for å måle breidda
    box.classList.add("is-visible");

    const buttonRect = button.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    let left = buttonRect.left + buttonRect.width / 2 - boxRect.width / 2;
    let top = buttonRect.bottom + gap;

    left = Math.max(margin, left); //ikkje gå utanfor venstre/høgre kant
    left = Math.min(left, window.innerWidth - boxRect.width - margin);

    if (top + boxRect.height > window.innerHeight - margin) { //om boksen går nedanfor skjermen, vis han over spørsmålsteiknet
        top = buttonRect.top - boxRect.height - gap;
    }

    top = Math.max(margin, top); //om han framleis går utanfor toppen, legg han så høgt som mogleg

    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.right = "auto";
    box.style.visibility = "";
}

function oppdaterLinje() {
    const høgreRect = document.querySelector(".høgre").getBoundingClientRect();
    const botnRect = document.querySelector(".botn").getBoundingClientRect();

    const lineTop = 250;      //same som i CSS
    const preferredHeight = 341;
    const minGap = 8;

    const available = botnRect.top - høgreRect.top - lineTop - minGap;
    const actualHeight = Math.max(0, Math.min(preferredHeight, available));

    document.querySelector(".høgre").style.setProperty("--linje-lengde", `${actualHeight}px`);
}

window.addEventListener("resize", oppdaterLinje);
window.addEventListener("scroll", oppdaterLinje, { passive: true });

oppdaterLinje();
oppdaterStreak()
initDaglegStreak();
oppdaterPlaceholder();
nyArtikkel();