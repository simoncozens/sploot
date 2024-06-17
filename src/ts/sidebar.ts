import $ from "jquery";

let options = `
<label for="relsize" class="form-label">Relative Size</label>
<input type="range" class="form-range" min="25" max="125" id="relsize">
<label for="baseline" class="form-label">Baseline</label>
<input type="range" class="form-range" min="-50" max="50" id="baseline">
<label for="baseline" class="form-label">Margin</label>
<input type="range" class="form-range" min="-50" max="50" id="margin">
<div id="palettes-input">
</div>
`;

$("#sidebar").html(`
<form>
    <div class="mb-3">
        <label for="alignment" class="form-label">Visual Alignment</label>
        <select class="form-select mb-2" id="alignment">
            <option selected value="auto">Automatic</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="center">Center</option>
        </select>

        <label for="script" class="form-label">Script</label>
        <select class="form-select mb-2" id="script">
            <option selected value="auto">Automatic</option>
        </select>

        <label for="language" class="form-label">Language</label>
        <select class="form-select mb-2" id="language">
            <option selected value="dflt">dflt - DFLT</option>
        </select>
    </div>

<ul class="nav nav-pills justify-content-center" id="tabs" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active p-1 m-0 " id="home-tab" data-bs-toggle="tab" data-bs-target="#features-pane" type="button" role="tab" aria-controls="features-pane" aria-selected="true">Features</button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link p-1 m-0 " id="variations" data-bs-toggle="tab" data-bs-target="#variations-pane" type="button" role="tab" aria-controls="variations-pane" aria-selected="false">Variations</button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link p-1 m-0" id="options" data-bs-toggle="tab" data-bs-target="#options-pane" type="button" role="tab" aria-controls="options-pane" aria-selected="false">Options</button>
  </li>
</ul>
<div class="tab-content" id="myTabContent">
  <div class="tab-pane fade show active" id="features-pane" role="tabpanel" aria-labelledby="features" tabindex="0">Features</div>
  <div class="tab-pane fade" id="variations-pane" role="tabpanel" aria-labelledby="variations" tabindex="0">
    <div class="m-2">No fonts with variations.</div>
  </div>
  <div class="tab-pane fade" id="options-pane" role="tabpanel" aria-labelledby="options" tabindex="0">${options}</div>
</div>
</form>
`)

// Alignment menu
$("#alignment").on("input", function() {
    let alignment = $(this).val();
    if (alignment == "auto") {
        $(".sample").css("text-align", "none");
    } else if (alignment == "left") {
        $(".sample").css("text-align", "left");  
    } else if (alignment == "center") {
        $(".sample").css("text-align", "center");
    } else if (alignment == "right") {
        $(".sample").css("text-align", "right");
    }
})

// Options menu
$("#relsize").on("input", function() {
    let size = $(this).val();
    $(".sample").css("font-size", `${size}px`);
});
$("#baseline").on("input", function() {
    let baseline = $(this).val();
    $(".sample").css("bottom", `${baseline}px`);
});
$("#margin").on("input", function() {
    let margin = $(this).val();
    $(".sample").css("margin-left", `${margin}px`);
    $(".sample").css("margin-right", `${margin}px`);
});
