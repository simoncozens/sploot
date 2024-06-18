import { parse } from "opentype.js";
import { Font as OTFont } from "opentype.js";

export interface HBGlyph {
  g: number;
  cl: number;
  offset: number;
  dx?: number;
  dy?: number;
  ax?: number;
  ay?: number;
  name?: string;
}

export interface Axis {
  min: number;
  max: number;
  default: number;
}

export interface ShapingOptions {
  features: any;
  featureString?: string;
  clusterLevel: number;
  direction: string;
  script: string;
  language: string;
  bufferFlag: string[];
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function onlyUnique(value: any, index: number, self: any) {
  return self.indexOf(value) === index;
}

declare let window: any;

export class Font {
  filename: string;
  binary: ArrayBuffer;
  base64?: string;
  fontFace?: string;
  hbFont?: any;
  otFont?: OTFont;
  supportedScripts: Set<string>;
  supportedLanguages: Set<string>;
  supportedFeatures: Set<string>;
  axes?: Map<string, Axis>;
  axisNames?: Map<string, string>;
  palettes: Map<string, number|string>;


  constructor(name: string, fontBlob: ArrayBuffer, faceIdx: number = 0) {
    this.filename = name;
    this.supportedLanguages = new Set();
    this.supportedScripts = new Set();
    this.supportedFeatures = new Set();
    this.axes = new Map();
    this.axisNames = new Map();
    this.palettes = new Map();
    if (fontBlob) {
      this.base64 = `data:application/octet-stream;base64,${arrayBufferToBase64(
        fontBlob
      )}`;
      this.fontFace = `@font-face{font-family:"${name}"; src:url(${this.base64});}`;
      const { hbjs } = window;
      const blob = hbjs.createBlob(fontBlob);
      const face = hbjs.createFace(blob, faceIdx);
      this.hbFont = hbjs.createFont(face);
      this.axes = face.getAxisInfos();
      this.otFont = parse(fontBlob);
      if (this.otFont && this.otFont.tables.gsub) {
        this.otFont.tables.gsub.scripts.forEach((script: any) => {
          this.supportedScripts.add(script.tag);
          if (script.script.langSysRecords) {
            script.script.langSysRecords.forEach((lang: any) => {
              this.supportedLanguages.add(lang.tag);
            });
          }
        });
      }
      if (this.otFont && this.otFont.tables.fvar) {
        this.axisNames = new Map();
        this.otFont.tables.fvar.axes.forEach((axis: any) => {
          this.axisNames.set(axis.tag, axis.name.en);
        });
      }
      if (this.otFont && this.otFont.tables.cpal) {
        let cpal = this.otFont.tables.cpal
        for (var paletteIdx in cpal.colorRecordIndices) {
          let ix = paletteIdx as unknown as number;
          if (cpal.paletteLabels && cpal.paletteLabels.length < ix-1) {
            this.palettes.set(cpal.paletteLabels[ix], ix);
          } else {
            this.palettes.set(`#${ix}`, ix);
          }
          if (cpal.paletteTypes) {
            console.log(cpal.paletteTypes[ix]);
            // This is not strictly true; there may be multiple palettes
            // OK to use in light and dark mode - the type does not
            // specify that one is recommended.
            if (parseInt(cpal.paletteTypes[ix],10) & 0x01) {
              console.log("Light")
              this.palettes.set("Light Mode", "light");
            }
            if (parseInt(cpal.paletteTypes[ix],10) & 0x02) {
              console.log("dark")
              this.palettes.set("Dark Mode", "dark");
            }
          }
        }
        console.log(this.palettes);
      }
    }
    return this;
  }


  shape(s: string, options: ShapingOptions) {
    const { hbjs } = window;
    let featurestring =
      options.featureString ||
      Object.keys(options.features)
        .map((f) => (options.features[f] ? "+" : "-") + f)
        .join(",");
    const font = this.hbFont;
    const buffer = hbjs.createBuffer();
    buffer.setClusterLevel(options.clusterLevel);
    buffer.addText(s);
    buffer.setFlags(options.bufferFlag);
    buffer.guessSegmentProperties();
    // console.log(options);
    featurestring = `+DUMY,${featurestring}`; // Seriously?
    // console.log(featurestring);
    if (options.direction !== "auto") {
      buffer.setDirection(options.direction);
    }
    if (options.script !== "") {
      buffer.setScript(options.script);
    }
    if (options.language !== "") {
      buffer.setLanguage(options.language);
    }

    const result = hbjs.shapeWithTrace(
      font,
      buffer,
      featurestring,
      0,
      0
    );
    const last = result[result.length - 1];
    buffer.destroy();
    last.t.forEach((g: HBGlyph) => {
      g.name = font.glyphName(g.g);
    })
    return last.t;
  }


  gsubFeatureTags(): string[] {
    if (!this.otFont) {
      return [];
    }
    if (!this.otFont.tables.gsub) {
      return [];
    }
    return this.otFont.tables.gsub.features
      .map((x: any) => x.tag)
      .filter(onlyUnique);
  }

  gposFeatureTags(): string[] {
    if (!this.otFont) {
      return [];
    }
    if (!this.otFont.tables.gpos) {
      return [];
    }
    return this.otFont.tables.gpos.features
      .map((x: any) => x.tag)
      .filter(onlyUnique);
  }

  allFeatureTags(): string[] {
    return [...this.gsubFeatureTags(), ...this.gposFeatureTags()].filter(
      onlyUnique
    );
  }

  setVariations(variations: Record<string, number>) {
    this.hbFont.setVariations(variations);
  }
}