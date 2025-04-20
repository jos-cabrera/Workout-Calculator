// DOM Utilities
function getInputContainers() {
	return document.querySelectorAll('.inputs-container');
}

function validateNumericInput(input) {
	const value = Number(input.value);
	const min = Number(input.min);
	const max = Number(input.max);

	const isValid = !isNaN(value) && min <= value && value <= max;

	return {
		isValid,
		error: isValid ? '' : `Number must be between ${min} and ${max}`,
	};
}

function validateRir(reps, rir) {
	if (rir >= reps) {
		return 'RIR cannot be equal to or greater than reps';
	}
	return '';
}

function createElement(tag, attributes = {}, textContent = '') {
	const element = document.createElement(tag);
	Object.entries(attributes).forEach(([key, value]) => {
		element.setAttribute(key, value);
	});
	if (textContent) element.textContent = textContent;
	return element;
}

// Exercise Science Calculations
function calculateOneRepMax(weight, reps) {
	return reps === 1 ? weight : weight / (1.0278 - 0.0278 * reps);
}

function estimateRepMaxes(oneRepMax) {
	const repMaxes = [];
	for (let reps = 1; reps <= 12; reps++) {
		const estimatedWeight = oneRepMax * (1.0278 - 0.0278 * reps);
		repMaxes.push({
			reps,
			weight: parseFloat(estimatedWeight.toFixed(2)),
		});
	}
	return repMaxes;
}

function calculateEffectiveReps(reps, rir) {
	const repsInReserve = Math.max(0, rir);
	const possibleEffectiveReps = Math.max(0, reps - repsInReserve);
	return Math.min(possibleEffectiveReps, 5);
}

function calculateEstimatedVolumes(remainingSets, rir) {
	const oneRepMax = calculateOneRepMax(allSets[0].weight, allSets[0].reps);
	const estimatedRepMaxes = estimateRepMaxes(oneRepMax);

	return estimatedRepMaxes.map((rm) => {
		const rmEffectiveReps = calculateEffectiveReps(rm.reps, rir);
		const addedVolume = remainingSets * rm.weight * rmEffectiveReps;
		return {
			...rm,
			totalVolume: parseFloat(
				(currentTotalVolume + addedVolume).toFixed(2)
			),
		};
	});
}

let allSets = [];
let currentTotalVolume = 0;

function displayCurrentVolume() {
	let volumeDisplay = document.getElementById('volume-display');
	if (!volumeDisplay) {
		volumeDisplay = createElement('div', {
			id: 'volume-display',
			class: 'volume-display',
		});
		document.querySelector('.content').appendChild(volumeDisplay);
	}
	volumeDisplay.textContent = `Current Total Volume: ${currentTotalVolume.toFixed(
		2
	)}`;
}

function createWorkoutSet(remainingSets) {
	const content = document.querySelector('.content');
	const errorElement = document.getElementById('error');
	let inputContainer = document.querySelector('.inputs-container');

	if (!inputContainer) {
		inputContainer = createElement('div', { class: 'inputs-container' });
		content.insertBefore(inputContainer, errorElement);
	} else {
		inputContainer.innerHTML = '';
	}

	const weightInput = createElement('input', {
		type: 'number',
		min: '1',
		max: '999',
		placeholder: 'Weight (kg)',
		class: 'weight-input',
	});
	const repsInput = createElement('input', {
		type: 'number',
		min: '1',
		max: '99',
		placeholder: 'Reps',
		class: 'reps-input',
	});
	const rirInput = createElement('input', {
		type: 'number',
		min: '0',
		max: '9',
		placeholder: 'RIR',
		class: 'rir-input',
	});
	const submitButton = createElement(
		'button',
		{ type: 'button', class: 'submit-btn' },
		'Calculate'
	);

	submitButton.addEventListener('click', () => {
		const weightValidation = validateNumericInput(weightInput);
		const repsValidation = validateNumericInput(repsInput);
		const rirValidation = validateNumericInput(rirInput);
		const repsValue = parseFloat(repsInput.value);
		const rirValue = parseFloat(rirInput.value);
		const rirRepsValidation = validateRir(repsValue, rirValue);

		errorElement.innerHTML = '';
		errorElement.style.display = 'none';

		const errors = [
			{
				condition: !weightValidation.isValid,
				message: weightValidation.error,
			},
			{
				condition: !repsValidation.isValid,
				message: repsValidation.error,
			},
			{ condition: !rirValidation.isValid, message: rirValidation.error },
			{ condition: rirRepsValidation, message: rirRepsValidation },
		].filter((e) => e.condition);

		if (errors.length > 0) {
			errorElement.style.display = 'block';
			errors.forEach((error) => {
				errorElement.appendChild(
					createElement(
						'div',
						{ class: 'error-item' },
						`• ${error.message}`
					)
				);
			});
			return;
		}

		const weight = parseFloat(weightInput.value);
		const reps = repsValue;
		const rir = rirValue;

		const currentSet = { weight, reps, rir };
		allSets.push(currentSet);

		// Update current total volume
		currentTotalVolume = allSets.reduce(
			(sum, { weight, reps, rir }) =>
				sum + weight * calculateEffectiveReps(reps, rir),
			0
		);

		displayCurrentVolume();

		// Calculate estimations for remaining sets
		const estimatedVolumes = calculateEstimatedVolumes(
			remainingSets - 1,
			rir
		);

		document.querySelectorAll('.rep-maxes').forEach((el) => el.remove());
		const repMaxesContainer = createElement('div', { class: 'rep-maxes' });
		repMaxesContainer.appendChild(
			createElement('h3', {}, 'Rep Max Estimates:')
		);

		// Find best 1RM by volume
		const bestVolume = Math.max(
			...estimatedVolumes.map((rm) => rm.totalVolume)
		);
		const bestRM = estimatedVolumes.find(
			(rm) => rm.totalVolume === bestVolume
		);

		estimatedVolumes.forEach((rm) => {
			const isBest = rm.reps === bestRM.reps;
			const label = isBest ? ' (Recommended)' : '';
			repMaxesContainer.appendChild(
				createElement(
					'div',
					{ class: 'rep-max-item' },
					`${rm.reps}RM: ${rm.weight.toFixed(
						2
					)} (Estimated Total Volume: ${rm.totalVolume.toFixed(
						2
					)})${label}`
				)
			);
		});

		content.insertBefore(repMaxesContainer, errorElement);

		if (remainingSets > 1) {
			createWorkoutSet(remainingSets - 1);
		} else {
			finalizeWorkout();
		}
	});

	inputContainer.append(weightInput, repsInput, rirInput, submitButton);
}

function finalizeWorkout() {
	const content = document.querySelector('.content');

	// Remove live volume display if present
	const volumeDisplay = document.getElementById('volume-display');
	if (volumeDisplay) volumeDisplay.remove();

	const setsSummary = generateSetSummary(allSets);

	content.append(
		createElement(
			'div',
			{ class: 'result-container' },
			`Total Effective Volume: ${currentTotalVolume.toFixed(2)}`
		),
		createElement(
			'div',
			{ class: 'summary-container' },
			`Sets: ${setsSummary}`
		),
		createCopyButton(setsSummary), // Add the copy button here
		createRestartButton()
	);

	document
		.querySelectorAll('.inputs-container, .rep-maxes')
		.forEach((el) => el.remove());
}

function createCopyButton(textToCopy) {
	const button = createElement(
		'button',
		{ class: 'copy-btn' },
		'Copy Sets Summary'
	);
	button.addEventListener('click', () => {
		navigator.clipboard.writeText(textToCopy).then(() => {
			button.textContent = 'Copied!';
			setTimeout(() => {
				button.textContent = 'Copy Sets Summary';
			}, 2000);
		});
	});
	return button;
}

function generateSetSummary(sets) {
	const weightRepsMap = {};
	sets.forEach(({ weight, reps }) => {
		const key = `${weight}x${reps}`;
		weightRepsMap[key] = (weightRepsMap[key] || 0) + 1;
	});
	return Object.entries(weightRepsMap)
		.map(([key, count]) => {
			const [weight, reps] = key.split('x');
			return `${weight}${count > 1 ? ` ${count}x${reps}` : ` ${reps}`}`;
		})
		.join(', ');
}

function createRestartButton() {
	const button = createElement(
		'button',
		{ class: 'restart-btn' },
		'Start New Session'
	);
	button.addEventListener('click', () => location.reload());
	return button;
}

document.addEventListener('DOMContentLoaded', () => {
	const initialForm = document.getElementById('initial-form');
	const setsInput = document.getElementById('sets-input');
	const errorElement = document.getElementById('error');

	initialForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const validation = validateNumericInput(setsInput);
		errorElement.innerHTML = '';
		errorElement.style.display = 'none';

		if (!validation.isValid) {
			errorElement.style.display = 'block';
			errorElement.appendChild(
				createElement(
					'div',
					{ class: 'error-item' },
					`• ${validation.error}`
				)
			);
			return;
		}
		initialForm.remove();
		createWorkoutSet(parseInt(setsInput.value));
	});
});
