// Created by peakd.com/@hivetrending
import data from "./hive-dapps.json" assert { type: "json" };

// global configuration
const width = 800;
const height = 700;

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

const plusOrMinus = () => {
  return Math.random() < 0.5 ? -1 : 1;
};
const randomOffset = (num) => {
  return num * plusOrMinus() * Math.random();
};

function updateData(nodes) {
  var u = d3.select("svg#viz").selectAll("g").data(nodes);

  u.enter()
    .append("g")
    .attr("class", "node")
    .each(function (d) {
      d3.select(this)
        .append("circle")
        .attr("class", function (d) {
          return `${d.color} stroke`;
        })
        .attr("r", function (d) {
          return clamp(d.label.length * 6.25, 20, 40);
        });

      d3.select(this)
        .append("text")
        .attr("dominant-baseline", "central")
        .attr("text-anchor", "middle")
        .text(function (d) {
          return d.label;
        })
        .style("font-size", "17px");
    });

  u.exit().remove();
}

function ticked() {
  var nodes = d3.select("svg#viz").selectAll("g");
  nodes.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
}

function handleComment(op) {
  const appId = findAppId(op);
  var label = getLabel(op);

  var color;
  if (appId) {
    color = getNodeColor(appId);
  } else {
    color = getNodeColor(label);
  }

  return [
    {
      label: label,
      color: color,
      x: width / 2 + randomOffset(100),
      y: height / 2 + randomOffset(100),
    },
  ];
}

function handleHiveEngineOps(op) {
  var nodes = [];
  var json = op[1].json;

  try {
    json = JSON.parse(json);
  } catch (err) {
    console.warn("Invalid JSON:", err);
    return [];
  }

  if (!json) {
    return nodes;
  }

  if (Array.isArray(json)) {
    for (const heOp of json) {

      const appId = findAppIdFromHESymbol(heOp.contractPayload.symbol);

      if (!appId) {
        continue;
      }

      const label = getNodeLabel(appId);
      const color = getNodeColor(appId);

      nodes.push({
        label: label,
        color: color,
        x: width / 2 + randomOffset(100),
        y: height / 2 + randomOffset(100),
      });
    }
  } else if (json.contractPayload) {

    const symbol = json.contractPayload.symbol;
    const appId = findAppIdFromHESymbol(symbol);

    if (!appId) {
      return nodes;
    }

    const label = getNodeLabel(appId);
    const color = getNodeColor(appId);

    console.debug(appId, label, color);

    nodes.push({
      label: label,
      color: color,
      x: width / 2 + randomOffset(100),
      y: height / 2 + randomOffset(100),
    });
  }

  return nodes;
}

function handleCustomJson(op) {
  var nodes = [];
  // Hive-Engine tokens
  var id = op[1].id;
  if (id.startsWith("ssc-mainnet")) {
    nodes = nodes.concat(handleHiveEngineOps(op));
  }

  const appId = findAppId(op);
  var label = getLabel(op);
  if (!label) {
    console.error("missing label for:", appId);
  }

  var color;
  if (appId) {
    color = getNodeColor(appId);
  } else {
    color = getNodeColor(label);
  }

  nodes.push({
    label: label,
    color: color,
    x: width / 2 + randomOffset(100),
    y: height / 2 + randomOffset(100),
  });

  return nodes;
}

function handleGeneric(op) {
  const appId = findAppId(op);
  var label = getLabel(op);

  var color;
  if (appId) {
    color = getNodeColor(appId);
  } else {
    color = getNodeColor(label);
  }

  return [
    {
      label: label,
      color: color,
      x: width / 2 + randomOffset(100),
      y: height / 2 + randomOffset(100),
    },
  ];
}

function createNodes(transactions) {
  var nodes = [];

  transactions.forEach((tx) => {
    tx.operations.forEach((op) => {
      const opname = op[0];
      var nodesThisOp = [];
      if (opname === "comment") {
        nodesThisOp = handleComment(op);
      } else if (opname === "custom_json") {
        nodesThisOp = handleCustomJson(op);
      } else {
        nodesThisOp = handleGeneric(op);
      }

      nodes = nodes.concat(nodesThisOp);
    });
  });
  return nodes;
}

function findAppIdFromHESymbol(symbol) {
  for (const [appId, appData] of Object.entries(data)) {
    if (appData.hiveEngineSymbols) {
      if (appData.hiveEngineSymbols.includes(symbol)) {
        console.debug("from HE symbol appId", appId);
        return appId;
      }
    }
  }
}

function findAppId(operation) {
  const opname = operation[0];

  var json = operation[1].json_metadata;
  if (json) {
    var json = JSON.parse(json);
  }

  if (json && json.app) {
    var app = json.app;

    if (typeof app === "string") {
      app = app.split("/")[0];
      app = app.split("-mobile-")[0]; // liketu-mobile-1.0.0-2d3f547
    } else if (app.name) {
      app = app.name;
    }
  }
  if (app) {
    console.debug("JSON app name", app);
  }

  if (app) {
    for (const [appId, appData] of Object.entries(data)) {
      if (appData.appNames) {
        for (const appName of appData.appNames) {
          if (appName.startsWith(app.toLowerCase())) {
            console.debug("appId", appId);
            return appId;
          }
        }
      }
    }
    console.warn("Did not find app in registry: ", app);
  }

  if (opname == "custom_json") {
    var id = operation[1].id;

    for (const [appId, app] of Object.entries(data)) {
      if (app.customJsonPrefixes) {
        for (const prefix of app.customJsonPrefixes) {
          if (id.startsWith(prefix)) {
            console.debug("appId", appId);
            return appId;
          }
        }
      }
    }
  }
  return null;
}

function getLabel(operation) {
  var opname = operation[0];

  if (opname == "comment") {
    const appId = findAppId(operation);
    if (appId && !Object.keys(data[appId]).includes("label")) {
      console.log(appId, "missing label");
    }
    if (appId && data[appId].label) {
      return data[appId].label;
    } else {
      return opname.charAt(0).toUpperCase() + opname.slice(1);
    }
  } else if (opname == "custom_json") {
    var id = operation[1].id;

    var json = operation[1].json;

    var app = json.app;
    if (typeof app === "object" && Object.keys(app).includes("name")) {
      app = app.name;
    }

    if (app) {
      for (const appData of Object.values(data)) {
        if (appData.appNames) {
          for (const appName of appData.appNames) {
            if (appName.startsWith(app)) {
              console.debug("Labeled by app name:", appData.label);
              return appData.label;
            }
          }
        }
      }
    }

    for (const appData of Object.values(data)) {
      if (appData.customJsonPrefixes) {
        for (const prefix of appData.customJsonPrefixes) {
          if (id.startsWith(prefix)) {
            return appData.label;
          }
        }
      }
    }

    if (id == "notify") {
      return "Notify";
    } else if (id == "follow") {
      return "Follow";
    } else if (id == "reblog") {
      return "Reblog";
    } else if (id == "community") {
      return "Community";
    } else if (id === "rc") {
      return "RC";
    } else {
      console.warn("Unrecognized CustomJSON id:", id);
      return "Other";
    }
  } else if (opname == "vote") {
    if (operation[1].weight > 0) {
      return "Up";
    } else {
    return "Down";
    }
  } else if (opname == "transfer") {
    return "Xfer"
  } else if (opname.startsWith("limit")) {
    return "Market"
  } else {
    // shorten the label
    var label = operation[0].split("_")[0];
    // capitalize first letter
    label = label.charAt(0).toUpperCase() + label.slice(1);
    label = label.substring(0, 9);
    return label;
  }
}

// Set node colors based on label strings

function getNodeLabel(appId) {
  if (Object.keys(data).includes(appId) && data[appId].label) {
    return data[appId].label;
  } else {
    console.warn("Label not found for: ", appId);
    return "Other";
  }
}

function getNodeColor(appId) {
  if (Object.keys(data).includes(appId) && data[appId].color) {
    return data[appId].color;
  } else {
    return "gray";
  }
}

// Start button controls
function gotoblock() {
  var blockNum = prompt(
    "Enter block number:",
    document.querySelector("#blockNum").innerText
  );

  // sanitize
  blockNum = parseInt(blockNum) - 1;

  if (!blockNum || blockNum < 0) {
    getLatestBlocknum();
  } else {
    document.querySelector("#blockNum").data = `${blockNum + 1}`;
    document.querySelector("#blockNum").innerText = `${blockNum}`;
  }
  runLoop();
}

document.querySelector("button#gotoblock").onclick = (e) => {
  gotoblock();
};

function pauseSimulation(pause) {
  if (document.querySelector("button#play").hidden) {
    document.querySelector("button#pause").hidden = true;
    document.querySelector("button#play").hidden = false;
  } else {
    document.querySelector("button#play").hidden = true;
    document.querySelector("button#pause").hidden = false;
  }
}

document.querySelector("button#pause").onclick = (e) => {
  pauseSimulation();
};
document.querySelector("button#play").onclick = (e) => {
  pauseSimulation();
};

function toggleSpeed(up) {
  const minSpeed = 1.0;
  const maxSpeed = 3.0;
  const speedIncrement = 1.0;

  const currentSpeed = getSpeedSetting();

  if (up) {
    var newSpeed = currentSpeed + speedIncrement;
  } else {
    var newSpeed = currentSpeed - speedIncrement;
  }

  newSpeed = clamp(newSpeed, minSpeed, maxSpeed);

  // update UI
  document.querySelector("span#speedgauge").data = `${newSpeed}`;
  document.querySelector("span#speedgauge").innerText = `${newSpeed}x`;
}

document.querySelector("button#fastforward").onclick = (e) => {
  toggleSpeed(true);
};

document.querySelector("button#backward").onclick = (e) => {
  toggleSpeed(false);
};

function getSpeedSetting() {
  if (!document.querySelector("span#speedgauge").data) {
    document.querySelector("span#speedgauge").data = "1.0";
  }

  var currentSpeed = parseFloat(document.querySelector("span#speedgauge").data);
  return currentSpeed;
}

// End button controls

hive.api.setOptions({ url: "https://api.deathwing.me/" });

function getLatestBlocknum() {
  // Get the current blocknum
  hive.api.getDynamicGlobalProperties(function (err, result) {
    if (err) {
      console.error(err);
      return;
    }

    var currentWitness = result.current_witness;
    document.querySelector("#currentWitness").innerText = `${currentWitness}`;

    var blockNum = result.head_block_number;
    document.querySelector("#blockNum").innerText = `${blockNum}`;
    document.querySelector("#blockNum").data = `${blockNum}`;

    runLoop();
  });
}

function runLoop() {
  var blockNum = document.querySelector("#blockNum").data;
  if (!blockNum) {
    console.debug("Failed to find block");
    return;
  }

  hive.api.getBlock(blockNum, function (err, result) {
    //console.log(err, result);
    //console.log(blockNum)
    if (err) {
      console.error(err);
      return;
    }

    var block = result;
    // check if the block looks okay
    if (!block || !block.transactions) {
      return;
    }

    const blockSize = block.transactions.length;
    document.querySelector(
      "#blockSize"
    ).innerText = `${blockSize.toLocaleString()} transactions`;

    d3.select("svg#viz").selectAll("g").remove();
    var nodes = createNodes(block.transactions);
    updateData(nodes);

    var simulation = d3
      .forceSimulation(nodes)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius(function (d) {
          return clamp(d.label.length * 6.25, 20, 40);
        })
      )
      .on("tick", ticked)
      .alpha(10);

    block.transactions.forEach((tx) => {
      tx.operations.forEach((op) => {
        if (op[0] === "custom_json") {
          if (getLabel(op) == "Other") {
            console.warn("Unknown app", JSON.stringify(op));
          }
        }
      });
    });

    // if we succeeded so far, advance to next block
    if (document.querySelector("#blockNum").data == `${parseInt(blockNum)}`) {
      document.querySelector("#blockNum").data = `${parseInt(blockNum) + 1}`;
      document.querySelector("#blockNum").innerText = `${blockNum}`;
      document.querySelector("#currentWitness").innerText = `${block.witness}`;
      document.querySelector("#timestamp").innerText = `${block.timestamp}`;
    }
  });

  console.info("Parsed block number:", blockNum);
}

// initialize, read params
var urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("block")) {
  var blockNum = urlParams.get("block");
  var blockNum = parseInt(blockNum);

  if (isNaN(blockNum) || blockNum < 0) {
    getLatestBlocknum();
  } else {
    document.querySelector("#blockNum").innerText = `${blockNum}`;
    document.querySelector("#blockNum").data = `${blockNum}`;
    runLoop();
  }
} else {
  getLatestBlocknum();
}

// repeat every N ms
function runtimeAdjustSpeed() {

  if (document.querySelector("button#pause").hidden != true && getSpeedSetting() != 0) {
    runLoop();
  }

  var currentSpeed = Math.abs(3000 / getSpeedSetting()); 

  if (currentSpeed != Infinity) {
    setTimeout(() => {
      runtimeAdjustSpeed();
    }, currentSpeed);
  } else {
    setTimeout(() => {
      runtimeAdjustSpeed();
    }, 1000);
  }
}

runtimeAdjustSpeed();

document.onkeydown = checkKey;

function checkKey(e) {
  e = e || window.event;

  if (e.keyCode == "38") {
    // up arrow
  } else if (e.keyCode == "40") {
    // down arrow
  } else if (e.keyCode == "37") {
    // left arrow
    toggleSpeed(false);
  } else if (e.keyCode == "39") {
    // right arrow
    toggleSpeed(true);
  } else if (e.keyCode == "32") {
    // spacebar
    pauseSimulation();
  } else if (e.keyCode == "83") {
    // s
    gotoblock();
  }
}

// override default space key handler
window.addEventListener("keydown", function (e) {
  if (e.keyCode == 32 && e.target == document.body) {
    e.preventDefault();
  }
});
