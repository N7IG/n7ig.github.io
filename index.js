const COMMAND_WIDTH = 15;

const canvas = document.getElementById("rec");
const ctx = canvas.getContext("2d");
const canvasR = document.getElementById("res");
const ctxR = canvasR.getContext("2d");
const input = document.getElementById("input");
const line = document.getElementById("line");
const depth = document.getElementById("depth");

function plannedCommandsFromRecommendation(
    recommendation,
    takeAllStands = false,
    removeOutdated = false
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

    return takeAllStands
        ? _.flatten(
              (recommendation.standRecommendations || []).map(
                  getDrillCommandsWithStandBoundaries
              )
          )
        : getDrillCommandsWithStandBoundaries(
              _.first(recommendation.standRecommendations)
          );
}

function getDrillCommandsWithStandBoundaries(standRecommendation) {
    const standBoundaries = getStandBoundaries(standRecommendation);
    return standRecommendation.drillCommands.map((drillCommand) => ({
        drillCommand,
        standBoundaries,
    }));
}

function getStandBoundaries(stand) {
    return [
        _.first(stand.drillCommands).startDepth,
        _.last(stand.drillCommands).endDepth,
    ];
}

function plannedSlidesFromRecommendations(recommendations) {
    return removeOutdatedCommands(
        _.flatten(
            (recommendations || []).map((recommendation, index) => {
                const isActualRecommendation =
                    index === recommendations.length - 1;
                return plannedCommandsFromRecommendation(
                    recommendation,
                    isActualRecommendation
                );
            })
        )
    )
        .filter(
            (combinedCommand) =>
                combinedCommand.drillCommand.drillCommandType === 2
        )
        .map((combinedCommand) => ({
            ...drillCommandToPlannedSlideVM(combinedCommand.drillCommand),
            standBoundaries: combinedCommand.standBoundaries,
        }));
}

function removeOutdatedCommands(drillCommands) {
    return drillCommands.reduce((filteredCommands, nextCommand) => {
        const nextDrillCommand = nextCommand.drillCommand;
        filteredCommands = filteredCommands.filter(
            (command) =>
                command.drillCommand.startDepth < nextDrillCommand.startDepth
        );

        if (!filteredCommands.length) {
            return [nextCommand];
        }

        if (
            nextDrillCommand.startDepth <
            _.last(filteredCommands).drillCommand.endDepth
        ) {
            _.last(filteredCommands).drillCommand.endDepth =
                nextDrillCommand.startDepth;
        }

        return [...filteredCommands, nextCommand];
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
        const firstStandCommands = _.first(rec.standRecommendations)
            .drillCommands;
        const firstStandStart = _.first(firstStandCommands).startDepth;
        const firstStandEnd = _.last(firstStandCommands).endDepth;
        ctx.fillStyle = "#7f8300";
        ctx.fillRect(
            firstStandStart,
            timePosition,
            firstStandEnd - firstStandStart,
            cw / 4
        );

        drawText(
            rec.standRecommendations[0].drillCommands[0].startDepth,
            timePosition + cw - 2,
            undefined,
            ctx
        );
        const recLg = rec.standRecommendations.length;
        const drilLg = rec.standRecommendations[recLg - 1].drillCommands.length;
        drawText(
            rec.standRecommendations[recLg - 1].drillCommands[drilLg - 1]
                .endDepth,
            timePosition + cw - 2,
            undefined,
            ctx
        );
    });
}

async function drawSlides(slides) {
    const cw = COMMAND_WIDTH * 4;
    let toggle = true;
    let d = 1;

    slides.forEach((sld) => {
        toggle = !toggle;

        ctxR.fillStyle = toggle
            ? "rgb(0, 150, 136, 0.9)"
            : "rgba(76, 175, 80, 0.9)";

        ctxR.fillRect(sld.range[0], 0, sld.range[1] - sld.range[0], cw);
        drawText(
            sld.range[0],
            COMMAND_WIDTH + COMMAND_WIDTH * (d++ % 2),
            "#ffffff",
            ctxR
        );
    });
}

function drawText(x, y, clr, ctx) {
    ctx.fillStyle = clr || "#ffffff";
    ctx.font = "15px Arial";
    ctx.fillText(Number(x).toFixed(3), x, y);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctxR.clearRect(0, 0, canvasR.width, canvasR.height);
}

async function main(data) {
    clearCanvas();
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
    depth.style.left = `${event.pageX}px`;
    depth.style.top = `${event.pageY > 165 ? event.pageY - 65 : 100}px`;
    depth.innerText = event.pageX;
});
