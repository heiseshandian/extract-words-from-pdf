import fs from "fs";
import path from "path";
// @ts-expect-error
import pdf from "pdf-to-text";

function getAbsolutePdfPathList(dir: string): string[] {
  return fs.readdirSync(dir).map((p) => path.resolve(__dirname, dir, p));
}

(function () {
  const pdfs = getAbsolutePdfPathList("./pdfs/");
  const expectRepeatTimes = parseRepeatTimes();

  let i = 0;
  pdfs.forEach((p) => {
    pdf.pdfToText(p, (err: any, data: any) => {
      if (err) {
        console.error(p, err);
      } else {
        const words = extractWords(data);
        countRepeatTimes(words);
        i++;

        if (i === pdfs.length) {
          const wordList = generateWordList(expectRepeatTimes);
          fs.writeFileSync(
            path.resolve(__dirname, "words.txt"),
            wordList.join("\n")
          );
        }
      }
    });
  });
})();

const DEFAULT_REPEAT_TIMES = 5;
function parseRepeatTimes(): number {
  return process.env.EXPECTED_REPEAT_TIMES
    ? parseInt(process.env.EXPECTED_REPEAT_TIMES)
    : DEFAULT_REPEAT_TIMES;
}

const wordsTimesMap: Map<string, number> = new Map();
function countRepeatTimes(words: string[]): void {
  words.forEach((w) => {
    if (wordsTimesMap.has(w)) {
      wordsTimesMap.set(w, wordsTimesMap.get(w)! + 1);
    } else {
      wordsTimesMap.set(w, 1);
    }
  });
}

function generateWordList(expectRepeatTimes: number): string[] {
  const words: Array<[word: string, times: number]> = [];
  wordsTimesMap.forEach((times, word) => {
    words.push([word, times]);
  });

  words.sort(([, timesA], [, timesB]) => timesB - timesA);

  const result: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (words[i][1] < expectRepeatTimes) {
      break;
    }

    result.push(words[i][0]);
  }

  return result;
}

const WORD = /^[a-z]+$/i;
function extractWords(str: string): string[] {
  return str.split(/\s+/).filter((w) => WORD.test(w));
}
