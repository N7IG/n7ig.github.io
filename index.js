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
        toggle = true;
        rec.standRecommendations.forEach((stand) => {
            stand.drillCommands.forEach((drillC) => {
                const closurePosition = timePosition;
                const closureI = commandCount;
                const closureToggle = toggle;
                // setTimeout(() => {
                ctx.fillStyle = closureToggle
                    ? "rgb(250, 0, 0, 0.5)"
                    : "rgba(233, 30, 99, 0.5)";
                if (drillC.drillCommandType === 2) {
                    ctx.fillStyle = closureToggle
                        ? "rgb(0, 150, 136, 0.9)"
                        : "rgba(76, 175, 80, 0.9)";
                }
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
