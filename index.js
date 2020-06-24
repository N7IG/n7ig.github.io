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
    let slideToggle = true;

    recommendations.forEach((rec) => {
        timePosition += 20;
        toggle = true;

        rec.standRecommendations.forEach((stand) => {
            stand.drillCommands.forEach((drillC) => {
                if (drillC.drillCommandType === 2) {
                    ctx.fillStyle = slideToggle
                        ? "rgb(0, 150, 136, 0.9)"
                        : "rgba(76, 175, 80, 0.9)";
                    slideToggle = !slideToggle;
                } else {
                    ctx.fillStyle = toggle
                        ? "rgb(250, 0, 0, 0.5)"
                        : "rgba(233, 30, 99, 0.5)";
                    toggle = !toggle;
                }
                ctx.fillRect(
                    drillC.startDepth,
                    timePosition,
                    drillC.endDepth - drillC.startDepth,
                    cw
                );
                commandCount++;
            });
        });
        drawText(
            rec.standRecommendations[0].drillCommands[0].startDepth,
            timePosition + cw - 2
        );
        const recLg = rec.standRecommendations.length;
        const drilLg = rec.standRecommendations[recLg - 1].drillCommands.length;
        drawText(
            rec.standRecommendations[recLg - 1].drillCommands[drilLg - 1]
                .endDepth,
            timePosition + cw - 2
        );
    });
}

function drawText(x, y) {
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.font = "15px Arial";
    ctx.fillText(Number(x).toFixed(3), x, y);
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
