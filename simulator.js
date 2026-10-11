const GRAVITY = 9.81;
const TOTAL_LENGTH = 100;

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function computeLeverState({
  fulcrumPercent = 35,
  loadMass = 4.5,
  effortForce = 80,
  effortDistance = 0.4,
} = {}) {
  const fulcrum = clamp(Number(fulcrumPercent) || 35, 10, 90);
  const mass = Number(loadMass) || 0;
  const force = Number(effortForce) || 0;
  const travel = Number(effortDistance) || 0;

  const effortArm = fulcrum;
  const loadArm = TOTAL_LENGTH - fulcrum;
  const loadForce = mass * GRAVITY;
  const requiredEffort = loadForce * (loadArm / Math.max(effortArm, 1));
  const effortTorque = force * effortArm;
  const loadTorque = loadForce * loadArm;
  const torqueDifference = effortTorque - loadTorque;
  const mechanicalAdvantage = effortArm / Math.max(loadArm, 1);
  const loadTravel = travel * (loadArm / Math.max(effortArm, 1));
  const workIn = force * travel;
  const workOut = loadForce * loadTravel;

  let balanceStatus = 'balanced';
  if (requiredEffort > force) {
    balanceStatus = 'insufficient';
  } else if (torqueDifference < -1) {
    balanceStatus = 'sufficient';
  }

  return {
    fulcrumPercent: fulcrum,
    effortArm,
    loadArm,
    loadForce,
    requiredEffort,
    effortTorque,
    loadTorque,
    torqueDifference,
    mechanicalAdvantage,
    loadTravel,
    workIn,
    workOut,
    balanceStatus,
    effortForce: force,
    loadMass: mass,
    effortDistance: travel,
  };
}

function formatNumber(value, decimals = 2) {
  return Number(value).toFixed(decimals);
}

function updateScene(state) {
  const root = document.documentElement;
  root.style.setProperty('--fulcrum', `${state.fulcrumPercent}%`);

  const effortMarker = document.getElementById('effortMarker');
  const loadMarker = document.getElementById('loadMarker');
  const effortMass = document.getElementById('effortMass');
  const loadMassTag = document.getElementById('loadMassTag');

  if (effortMarker) {
    effortMarker.style.left = `calc(${state.fulcrumPercent}% - 90px)`;
  }

  if (loadMarker) {
    loadMarker.style.left = `calc(${state.fulcrumPercent}% + 90px)`;
  }

  if (effortMass) {
    effortMass.style.left = `calc(${state.fulcrumPercent}% - 182px)`;
  }

  if (loadMassTag) {
    loadMassTag.style.left = `calc(${state.fulcrumPercent}% + 120px)`;
  }

  const statusBadge = document.getElementById('statusBadge');
  const summaryText = document.getElementById('summaryText');

  if (statusBadge) {
    statusBadge.textContent =
      state.balanceStatus === 'insufficient'
        ? 'Insufficient'
        : state.balanceStatus === 'sufficient'
          ? 'Ready'
          : 'Balanced';

    statusBadge.classList.remove('balanced', 'insufficient', 'sufficient');
    statusBadge.classList.add(state.balanceStatus);
  }

  if (summaryText) {
    if (state.balanceStatus === 'insufficient') {
      summaryText.textContent =
        'The applied effort is too small to balance the load at this fulcrum placement. Moving the fulcrum closer to the load makes the lever easier to lift.';
    } else if (state.balanceStatus === 'sufficient') {
      summaryText.textContent =
        'The effort force exceeds the minimum needed to balance the load, so the lever can lift the load with a margin of safety.';
    } else {
      summaryText.textContent =
        'The torque from the applied effort and the torque from the load are effectively matched, showing the lever is near equilibrium.';
    }
  }
}

function updateReadouts(state) {
  const maValue = document.getElementById('maValue');
  const requiredEffortValue = document.getElementById('requiredEffortValue');
  const loadTravelValue = document.getElementById('loadTravelValue');
  const torqueValue = document.getElementById('torqueValue');

  if (maValue) {
    maValue.textContent = formatNumber(state.mechanicalAdvantage, 2);
  }

  if (requiredEffortValue) {
    requiredEffortValue.textContent = `${formatNumber(state.requiredEffort, 1)} N`;
  }

  if (loadTravelValue) {
    loadTravelValue.textContent = `${formatNumber(state.loadTravel, 2)} m`;
  }

  if (torqueValue) {
    torqueValue.textContent = `${formatNumber(state.torqueDifference, 1)} N·m`;
  }
}

function bindControls() {
  const controls = {
    fulcrum: document.getElementById('fulcrum'),
    loadMass: document.getElementById('loadMass'),
    effortForce: document.getElementById('effortForce'),
    effortDistance: document.getElementById('effortDistance'),
  };

  const displayMap = {
    fulcrum: document.getElementById('fulcrumValue'),
    loadMass: document.getElementById('loadMassValue'),
    effortForce: document.getElementById('effortForceValue'),
    effortDistance: document.getElementById('effortDistanceValue'),
  };

  const renderFromInputs = () => {
    const state = computeLeverState({
      fulcrumPercent: Number(controls.fulcrum.value),
      loadMass: Number(controls.loadMass.value),
      effortForce: Number(controls.effortForce.value),
      effortDistance: Number(controls.effortDistance.value),
    });

    displayMap.fulcrum.textContent = `${state.fulcrumPercent}%`;
    displayMap.loadMass.textContent = `${formatNumber(state.loadMass, 1)} kg`;
    displayMap.effortForce.textContent = `${formatNumber(state.effortForce, 0)} N`;
    displayMap.effortDistance.textContent = `${formatNumber(state.effortDistance, 2)} m`;

    updateScene(state);
    updateReadouts(state);
  };

  Object.values(controls).forEach((control) => control.addEventListener('input', renderFromInputs));

  const fulcrumMarker = document.getElementById('fulcrumMarker');
  const scene = document.querySelector('.lever');
  let dragging = false;

  function updateFulcrumFromPointer(clientX) {
    if (!scene || !controls.fulcrum) {
      return;
    }

    const rect = scene.getBoundingClientRect();
    const minPercent = 10;
    const maxPercent = 90;
    const position = ((clientX - rect.left) / rect.width) * 100;
    const nextPercent = clamp(position, minPercent, maxPercent);
    controls.fulcrum.value = String(nextPercent);
    renderFromInputs();
  }

  if (fulcrumMarker) {
    fulcrumMarker.addEventListener('pointerdown', (event) => {
      dragging = true;
      fulcrumMarker.setPointerCapture(event.pointerId);
    });

    fulcrumMarker.addEventListener('pointermove', (event) => {
      if (!dragging) {
        return;
      }
      updateFulcrumFromPointer(event.clientX);
    });

    fulcrumMarker.addEventListener('pointerup', () => {
      dragging = false;
    });

    fulcrumMarker.addEventListener('pointerleave', () => {
      dragging = false;
    });
  }

  renderFromInputs();
}

if (typeof document !== 'undefined') {
  bindControls();
}
