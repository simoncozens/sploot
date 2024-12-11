import { Font, Axis, onlyUnique } from "./font";
import { FEATURETAGS } from "./constants";
import $ from "jquery";

var unicode = require("unicode-properties");

class FontList {
  /// This is the list of all the loaded fonts, but it's also the
  /// singleton repository of all the state of the application.
  fonts: Font[];
  selectedFont: Font;

  constructor() {
    this.fonts = [];
    this.selectedFont = null;
  }

  combinedAxes(): Record<string, Axis> {
    let axes: Record<string, Axis> = {};
    for (let font of this.fonts) {
      for (let [tag, axis] of Object.entries(font.axes)) {
        if (axes[tag]) {
          axes[tag].min = Math.min(axes[tag].min, axis.min);
          axes[tag].max = Math.max(axes[tag].max, axis.max);
        } else {
          axes[tag] = axis;
        }
      }
    }
    return axes;
  }

  combinedGSUBFeatures(): string[] {
    let features: string[] = [];
    for (let font of this.fonts) {
      features = features.concat(font.gsubFeatureTags());
    }
    return features.filter(onlyUnique);
  }

  combinedGPOSFeatures(): string[] {
    let features: string[] = [];
    for (let font of this.fonts) {
      features = features.concat(font.gposFeatureTags());
    }
    return features.filter(onlyUnique);
  }
  combinedPalettes(): Record<string, (number | string)[]> {
    let palettes: Record<string, (number | string)[]> = {};
    for (let font of this.fonts) {
      for (let [name, index] of font.palettes.entries()) {
        palettes[name] = [];
      }
    }
    for (let font of this.fonts) {
      for (let [name, index] of Object.entries(palettes)) {
        if (font.palettes.has(name)) {
          index.push(font.palettes.get(name));
        } else {
          index.push(-1);
        }
      }
    }

    return palettes;
  }

  combinedAxisNames(): Record<string, string> {
    let axes: Record<string, string> = {};
    for (let font of this.fonts) {
      for (let [tag, name] of font.axisNames) {
        axes[tag] = name;
      }
    }
    return axes;
  }

  combinedInstanceNames(): string[] {
    let instances: string[] = [];
    for (let font of this.fonts) {
      instances = instances.concat(...font.namedInstances.keys());
    }
    return instances.filter(onlyUnique);
  }

  update() {
    // Save state
    let variations = this.variations();
    let features = this.features();
    let selected = this.selectedFont;

    this.updateFontList();
    this.updateVariations();
    this.updatePalettes();
    this.updateFeatures();

    // Restore state
    $(".axis-slider").each(function () {
      let tag = $(this).attr("id").split("-")[0];
      $(this).val(variations[tag]);
    });
    $("span[data-feature]").each(function () {
      let feature = $(this).data("feature");
      $(this).removeClass("text-bg-primary text-bg-danger text-bg-secondary");
      if (feature in features) {
        if (features[feature]) {
          $(this).data("feature-state", "on");
          $(this).addClass("text-bg-primary");
        } else {
          $(this).data("feature-state", "off");
          $(this).addClass("text-bg-danger");
        }
      } else {
        $(this).data("feature-state", "auto");
        $(this).addClass("text-bg-secondary");
      }
    });
    this.fonts.forEach((font) => {
      font.setVariations(this.variations());
    });
    $(".sample").css("font-feature-settings", this.featuresCSS());
    if (selected) {
      let selectedIndex = this.fonts.indexOf(selected);
      $(`.font-item[data-index=${selectedIndex}]`).trigger("click");
    }

    this.updateText();
  }

  updateFontList() {
    $("#fontcss").empty();
    for (let font of this.fonts) {
      $("#fontcss").append(font.fontFace);
    }
    if (this.fonts.length == 0) {
      $("#drop-sign").show();
    } else {
      $("#drop-sign").hide();
    }
    $("#fontlist").empty();
    let text = $("#text").val() as string;
    for (let [index, font] of this.fonts.entries()) {
      $("#fontlist").append(
        `<div class="font-item" data-index="${index}">
          <div class="font-name text-muted">${font.filename}</div>
          <div class="sample" style="font-family: '${font.familyname}', 'Adobe Notdef'">${text}</div>
          <div class="hbsample" style="display: none"></div>
        </div>`
      );
    }

    $(".font-item").on("click", function (e) {
      e.stopPropagation();
      let index = $(this).data("index");
      fontlist.selectedFont = fontlist.fonts[index];
      $(".font-item").removeClass("selected");
      $(this).addClass("selected");
      fontlist.updateText();
    });
    $("#main").on("click", function () {
      $(".font-item").removeClass("selected");
      fontlist.selectedFont = null;
    });
  }

  // Reset the axes
  updateVariations() {
    $("#variations-pane").empty();
    let namedInstances = this.combinedInstanceNames();
    if (namedInstances.length) {
      $("#variations-pane").append(`
        <select class="form-select mb-2" id="instances">
          <option value="default">Named Instances</option>
      `);
      for (var name of namedInstances.sort()) {
        let option = $(`<option value="${name}">${name}</option>`);
        $("#instances").append(option);
      }
      let that = this;
      $("#instances").on("input", function () {
        let instancename = $("#instances").val() as string;
        if (instancename == "default") {
          $(".sample").css(`font-variation-settings`, "");
          return;
        }
        let instances = fontlist.combinedInstanceNames();
        let variations = fontlist.combinedAxes();
        for (let font of fontlist.fonts) {
          if (font.namedInstances.has(instancename)) {
            let instance = font.namedInstances.get(instancename);
            for (let [tag, value] of Object.entries(instance)) {
              $(`#${tag}-axis`).val(value);
            }
            $(".sample").css(`font-variation-settings`, that.variationsCSS());
            font.setVariations(fontlist.variations());
            fontlist.updateText();
          }
        }
      });
    }
    let axisNameMap = this.combinedAxisNames();
    let that = this;
    for (let [tag, axis] of Object.entries(this.combinedAxes())) {
      let name = axisNameMap[tag];
      let axis_slider = $(`
        <label for="${tag}-axis" class="form-label">${name} (${tag})</label>
        <input type="range" class="form-range axis-slider" min="${axis.min}" max="${axis.max}" value="${axis.default}" id="${tag}-axis">
      `);
      $("#variations-pane").append(axis_slider);
      axis_slider.on("input", () => {
        $(".sample").css(`font-variation-settings`, this.variationsCSS());
        that.fonts.forEach((font) => {
          font.setVariations(that.variations());
        });
        that.updateText();
      });
    }
    $("#variations-pane").append(`
      <a class="btn btn-primary" id="reset-axes">Reset Axes</a>
    `);
    $("#reset-axes").on("click", function () {
      $(".axis-slider").each(function () {
        $(this).val($(this).attr("value"));
      });
      $(".sample").css(`font-variation-settings`, "");
    });
  }

  setToDefaultPalette() {
    var theme = localStorage.getItem("theme");
    if (theme == "auto") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    $(".sample").css("font-palette", theme);
  }

  updatePalettes() {
    let palettes = this.combinedPalettes();
    $("#palettes-input").empty();
    if (Object.keys(palettes).length) {
      $("#palettes-input").append(
        `<label for="palettes" class="form-label">Color palettes</label>`
      );
      let select = $(`
        <select class="form-select mb-2" id="palettes">
        <option value="default">Default for color theme</option>
      `);
      for (var name of Object.keys(palettes).sort()) {
        let option = $(`<option value="${name}">${name}</option>`);
        select.append(option);
      }
      $("#palettes-input").append(select);
      select.on("input", () => {
        let palettename = select.val() as string;
        if (palettename == "default") {
          this.setToDefaultPalette();
          return;
        }
        let entries = palettes[palettename];
        $(".sample").each((index, el) => {
          var palettechoice = entries[index];
          if (typeof palettechoice == "string" || palettechoice > -1) {
            $(el).css("font-palette", palettechoice);
          } else {
            $(el).css("font-palette", "none");
          }
        });
      });
      this.setToDefaultPalette();
    }
  }

  updateFeatures() {
    let gsub = this.combinedGSUBFeatures();
    let gpos = this.combinedGPOSFeatures();
    $("#gsub-features").empty();
    $("#gpos-features").empty();
    let that = this;
    function addFeature(area, feature) {
      let div = $(`<div class="feature mb-2">`);
      let pill = $(
        `<span class="badge rounded-pill text-bg-secondary" data-feature="${feature}" data-feature-state="auto">${feature}</span>`
      );
      let nextState = {
        on: "off",
        off: "auto",
        auto: "on",
      };
      let background = {
        on: "text-bg-primary",
        off: "text-bg-danger",
        auto: "text-bg-secondary",
      };
      pill.on("click", function () {
        let state = $(this).data("feature-state");
        let next = nextState[state];
        $(this).data("feature-state", next);
        $(this).removeClass(background[state]);
        $(this).addClass(background[next]);
        $(".sample").css("font-feature-settings", that.featuresCSS());
        that.updateText();
      });
      div.append(pill);
      if (feature in FEATURETAGS) {
        div.append(" " + FEATURETAGS[feature]);
      }
      area.append(div);
    }
    for (let feature of gsub) {
      addFeature($("#gsub-features"), feature);
    }
    for (let feature of gpos) {
      addFeature($("#gpos-features"), feature);
    }
  }

  // Shaping parameter stat
  variations(): Record<string, number> {
    let allVariations = {};
    $(".axis-slider").each(function () {
      let tag = $(this).attr("id").split("-")[0];
      allVariations[tag] = $(this).val();
    });
    return allVariations;
  }

  variationsCSS(): string {
    return Object.entries(this.variations())
      .map(([tag, val]) => `"${tag}" ${val}`)
      .join(", ");
  }

  features(): Record<string, boolean> {
    let allFeatures = {};
    $("span[data-feature]").each(function () {
      let feature = $(this).data("feature");
      let state = $(this).data("feature-state");
      if (state == "on") {
        allFeatures[feature] = true;
      } else if (state == "off") {
        allFeatures[feature] = false;
      }
    });
    return allFeatures;
  }

  featuresCSS() {
    return Object.entries(this.features())
      .map(([tag, val]) => (val ? `"${tag}"` : `"${tag}" 0`))
      .join(",");
  }

  // Called on change of text, or change of shaping parameters
  updateText() {
    let text = $("#text").val() as string;
    $("#charlist-body").empty();
    for (let i = 0; i < text.length; i++) {
      let codepoint = text.codePointAt(i);
      let codepoint_formatted = codepoint.toString(16).padStart(4, "0");
      let script = unicode.getScript(codepoint);
      let category = unicode.getCategory(codepoint);
      $("#charlist-body").append(
        `<tr><td>${text[i]}</td>
            <td>U+${codepoint_formatted}</td>
            <td>${script}</td>
            <td>${category}</td>
            <td>${i}</td></tr>
             `
      );
    }
    $(".sample").html(text);
    $(".hbsample").empty();
    let selectedIndex = Math.max(this.fonts.indexOf(this.selectedFont),0);
    console.log("Selected index", selectedIndex);
    for (let [ix, font] of this.fonts.entries()) {
      
      if (ix == selectedIndex) {
        var shaped = font.shape(text, {
          features: this.features(),
          clusterLevel: 0,
          bufferFlag: [],
          direction: "auto",
          script: "",
          language: "",
        });
        $("#glyphlist-body").empty();
        $("#glyphlist").show();
        for (let i = 0; i < shaped.length; i++) {
          let glyph = shaped[i];
          $("#glyphlist-body").append(
            `<tr><td>${glyph.name}</td>
            <td>${glyph.ax}</td>
            <td>${glyph.dx}</td>
            <td>${glyph.dy}</td>
            <td>${glyph.cl}</td>
            <td>${glyph.g}</td>
             `
          );
        }
        $("#glyphlist-body tr").on("click", function (e) {
          console.log("Click!", this)
          $("#glyphlist-body tr").removeClass("selected");
          $("#glyphlist-body tr td").removeClass("selected");
          $(this).addClass("selected");
          $(this).find("td").addClass("selected");
          e.stopPropagation();
          fontlist.updateHbsample();
        });
      }
    }
    this.updateHbsample();
  }

  updateHbsample() {
    let text = $("#text").val() as string;
    $(".hbsample").empty();
    let selectedGlyph = $("#glyphlist-body tr.selected").index();
    for (let [ix, font] of this.fonts.entries()) {
        let shaped = font.shape(text, {
        features: this.features(),
        clusterLevel: 0,
        bufferFlag: [],
        direction: "auto",
        script: "",
        language: ""
        });
        if (shaped.length > 0) {
        font.glyphstringToSVG(shaped, selectedGlyph).addTo($(`.hbsample`).get(ix));
        }
      }
  }

}

export let fontlist = window["fontlist"] = new FontList();
