const COMMAND_WIDTH = 15;

const canvas = document.getElementById("rec");
const ctx = canvas.getContext("2d");
const canvasR = document.getElementById("res");
const ctxR = canvasR.getContext("2d");
const input = document.getElementById("input");
const line = document.getElementById("line");

function plannedSlidesFromRecommendation(
    recommendation,
    takeAllStands = false
) {
    // only look at 1st recommendation (current drilling unit)
    // GetRecommendations return the history of the recommendations all the way to the target
    // Slide evaluation page & Rig floor page should only consider the 1st stand in the standRecommendations property
    // while etude trajectory page should have all stands to display all slides
    if (
        !recommendation.standRecommendations ||
        recommendation.standRecommendations.length === 0
    ) {
        return [];
    }

    const drillCommands = takeAllStands
        ? _.flatten(
              (recommendation.standRecommendations || []).map(
                  (stand) => stand.drillCommands
              )
          )
        : _.first(recommendation.standRecommendations).drillCommands;

    return drillCommands
        .filter((drillCommand) => drillCommand.drillCommandType === 2)
        .map(drillCommandToPlannedSlideVM);
}

function plannedSlidesFromRecommendations(recommendations) {
    return removeOutdatedIntervals(
        _.flatten(
            (recommendations || []).map((recommendation, index) => {
                const isActualRecommendation =
                    index === recommendations.length - 1;
                return plannedSlidesFromRecommendation(
                    recommendation,
                    isActualRecommendation
                );
            })
        )
    );
}

function removeOutdatedIntervals(plannedSlideIntervals) {
    return plannedSlideIntervals.reduce((filteredIntervals, nextInterval) => {
        filteredIntervals = filteredIntervals.filter(
            (interval) => interval.range[0] < nextInterval.range[0]
        );

        if (!filteredIntervals.length) {
            return [nextInterval];
        }

        if (nextInterval.range[0] < _.last(filteredIntervals).range[1]) {
            _.last(filteredIntervals).range[1] = nextInterval.range[0];
        }

        return [...filteredIntervals, nextInterval];
    }, []);
}

function drillCommandToPlannedSlideVM({
    endDepth,
    startDepth,
    toolface,
    toolfaceMode,
}) {
    return {
        range: [startDepth, endDepth],
        toolface: {
            val: toolface,
            mode: toToolfaceModeVM(toolfaceMode),
        },
    };
}

function toToolfaceModeVM(toolfaceMode) {
    return ["M", "G"][toolfaceMode];
}

async function getDataJson(path) {
    return (await fetch(path)).json();
}

async function draw(recommendations) {
    const cw = COMMAND_WIDTH;
    let timePosition = 0;
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

async function drawSlides(slides) {
    const cw = COMMAND_WIDTH * 4;
    let toggle = true;

    slides.forEach((sld) => {
        toggle = !toggle;

        ctxR.fillStyle = toggle
            ? "rgb(0, 150, 136, 0.9)"
            : "rgba(76, 175, 80, 0.9)";

        ctxR.fillRect(sld.range[0], 0, sld.range[1] - sld.range[0], cw);
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
    const slides = plannedSlidesFromRecommendations(data.recommendations);
    drawSlides(slides);
}

async function handleFiles() {
    const reader = new FileReader();
    reader.onload = function (e) {
        main(JSON.parse(e.target.result));
    };
    reader.readAsText(this.files[0]);
}

input.addEventListener("input", handleFiles, false);
document.addEventListener("mousemove", (event) => {
    line.style.left = `${event.pageX}px`;
});
