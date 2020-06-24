const COMMAND_WIDTH = 15;

const canvas = document.getElementById("rec");
const ctx = canvas.getContext("2d");
const input = document.getElementById("input");

async function getDataJson(path) {
    return (await fetch(path)).json();
}

async function draw(recommendations) {
    const cw = COMMAND_WIDTH;
    let timePosition = 0;
    let commandCount = 0;
    let toggle = true;

    recommendations.forEach((rec) => {
        timePosition += 20;
        rec.standRecommendations.forEach((stand) => {
            stand.drillCommands.forEach((drillC) => {
                const closurePosition = timePosition;
                const closureI = commandCount;
                const closureToggle = toggle;
                // setTimeout(() => {
                ctx.fillStyle = closureToggle
                    ? "rgb(250, 0, 0, 0.5)"
                    : "rgba(0, 0, 250, 0.5)";
                ctx.fillRect(
                    drillC.startDepth,
                    closurePosition,
                    drillC.endDepth - drillC.startDepth,
                    cw
                );
                // }, closureI * 10);
                commandCount++;
                toggle = !toggle;
            });
        });
    });
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function main(data) {
    draw(data.recommendations);
}

input.addEventListener("input", handleFiles, false);

async function handleFiles() {
    const reader = new FileReader();
    reader.onload = function (e) {
        main(JSON.parse(e.target.result));
    };
    reader.readAsText(this.files[0]);
}
