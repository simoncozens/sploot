import { Font, Axis } from "./font";
import $ from "jquery";

class FontList {
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

  combinedPalettes(): Record<string, (number|string)[]> {
    let palettes: Record<string, (number|string)[]> = {}
    for (let font of this.fonts) {
      for (let [name, index] of font.palettes.entries()) {
        palettes[name] = []
      }
    }
    for (let font of this.fonts) {
      for (let [name, index] of Object.entries(palettes)) {
        if (font.palettes.has(name)) {
          index.push(font.palettes.get(name))
        }
        else {
          index.push(-1)
        }
      }
    }

    console.log(palettes);
    return palettes
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

  addFont(font: Font) {
    this.fonts.push(font);
    $("#fontcss").append(font.fontFace);
    this.updateFontList();
    this.updateVariations();
    window["font"] = font;
    this.updatePalettes();
    console.log(font)
  }

  updateFontList() {
    if (this.fonts.length == 0) {
      $("#drop-sign").show()
    } else {
      $("#drop-sign").hide()
    }
    $("#fontlist").empty();
    let text = $("#text").val() as string;
    for (let [index, font] of this.fonts.entries()) {
      $("#fontlist").append(
        `<div class="font-item" data-index="${index}">
          <div class="font-name text-muted">${font.filename}</div>
          <div class="sample" style="font-family: '${font.filename}'">${text}</div>
        </div>`
      );
    }

    $(".font-item").on("click", function (e) {
      e.stopPropagation();
      let index = $(this).data("index");
      fontlist.selectedFont = fontlist.fonts[index];
      $(".font-item").removeClass("selected");
      $(this).addClass("selected");
    });
    $("#main").on("click", function () {
      $(".font-item").removeClass("selected");
      fontlist.selectedFont = null;
    });
  }

  // Reset the axes
  updateVariations() {
    $("#variations-pane").empty();
    let axisNameMap = this.combinedAxisNames()
    for (let [tag, axis] of Object.entries(this.combinedAxes())) {
      let name = axisNameMap[tag];
      let axis_slider = $(`
        <label for="${tag}-axis" class="form-label">${name} (${tag})</label>
        <input type="range" class="form-range axis-slider" min="${axis.min}" max="${axis.max}" value="${axis.default}" id="${tag}-axis">
      `);
      $("#variations-pane").append(axis_slider);
      axis_slider.on("input", function () {
        let allVariations = "";
        $(".axis-slider").each(function () {
          let tag = $(this).attr("id").split("-")[0];
          allVariations += `"${tag}" ${$(this).val()}, `;
        });
        $(".sample").css(`font-variation-settings`, allVariations.substring(0, allVariations.length - 2));
      });
    }
    $("#variations-pane").append(`
      <button class="btn btn-primary" id="reset-axes">Reset Axes</button>
    `)
    $("#reset-axes").on("click", function () {
      $(".axis-slider").each(function () {
        $(this).val($(this).attr("value"));
      });
      $(".sample").css(`font-variation-settings`, "");
    });
  }

  updatePalettes() {
    let palettes = this.combinedPalettes();
    $("#palettes-input").empty();
    if (Object.keys(palettes).length) {
      $("#palettes-input").append(`<label for="palettes" class="form-label">Color palettes</label>`)
      let select = $(`<select class="form-select mb-2" id="palettes">`)
      for (var name of Object.keys(palettes).sort()) {
        let option = $(`<option value="${name}">${name}</option>`)
        select.append(option);
      }
      $("#palettes-input").append(select);
      select.on("input", function() {
        let palettename = select.val() as string;
        let entries = palettes[palettename];
        $(".sample").each( (index, el) => {
          var palettechoice = entries[index];
          console.log(`Font ${index} -> palette ${palettechoice}`);
          console.log(el);
          if (typeof palettechoice == "string" || palettechoice > -1) {
            $(el).css("font-palette", palettechoice);
          } else {
            $(el).css("font-palette", "none");
          }
        })

      })
    }
  }

}

export let fontlist = new FontList();