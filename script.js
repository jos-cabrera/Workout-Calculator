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

function estimateRepMaxes(weight, repsDone) {
	const oneRepMax = calculateOneRepMax(weight, repsDone);
	const repMaxes = [];

	for (let reps = 1; reps <= 12; reps++) {
		const estimatedWeight = oneRepMax * (1.0278 - 0.0278 * reps);
		repMaxes.push({
			reps,
			weight: parseFloat(estimatedWeight.toFixed(2)),
			volume: parseFloat((estimatedWeight * reps).toFixed(2)),
		});
	}

	return repMaxes;
}

function calculateOptimalWeight(oneRepMax, targetReps, targetRir) {
	const targetRepMax = oneRepMax * (1.0278 - 0.0278 * targetReps);
	return parseFloat((targetRepMax * (1 + targetRir * 0.025)).toFixed(2));
}

function calculateEffectiveReps(reps, rir) {
	if (rir > 5) return 0;

	const baseEffectiveReps = Math.min(5, reps);

	if (rir >= 3 && rir <= 5) return baseEffectiveReps * 0.4;
	if (rir >= 1 && rir <= 2) return baseEffectiveReps * 0.85;
	if (rir === 0) return baseEffectiveReps * 1.0;

	return 0;
}

// Workout Logic
let allSets = [];

function createWorkoutSet(
	remainingSets,
	accumulatedVolume = 0,
	previousOneRepMax = 0
) {
	const content = document.querySelector('.content');
	const errorElement = document.getElementById('error');
	const targetReps = 8;
	const targetRir = 1;

	if (!content || !errorElement) {
		console.error('Missing required DOM elements');
		return;
	}

	if (remainingSets >= 1) {
		const inputContainer = createElement('div', {
			class: 'inputs-container',
		});

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
				{
					condition: !rirValidation.isValid,
					message: rirValidation.error,
				},
				{ condition: rirRepsValidation, message: rirRepsValidation },
			].filter((error) => error.condition);

			if (errors.length > 0) {
				errorElement.style.display = 'block';
				errors.forEach((error) => {
					const errorItem = createElement(
						'div',
						{ class: 'error-item' },
						`• ${error.message}`
					);
					errorElement.appendChild(errorItem);
				});
				return;
			}

			const weight = parseFloat(weightInput.value);
			const reps = repsValue;
			const rir = rirValue;

			const repMaxes = estimateRepMaxes(weight, reps);
			const currentOneRepMax = repMaxes[0].weight;

			const effectiveReps = calculateEffectiveReps(reps, rir);
			const currentVolume = weight * effectiveReps;

			allSets.push({
				weight,
				reps,
				rir,
				volume: weight * effectiveReps,
			});

			if (allSets.length > 5) allSets.shift();

			let totalEffectiveVolume = 0;
			for (let i = 0; i < allSets.length; i++) {
				const { weight, reps, rir } = allSets[i];
				const effectiveReps = calculateEffectiveReps(reps, rir);
				totalEffectiveVolume += weight * effectiveReps;
			}

			// Remove previous rep max list
			document
				.querySelectorAll('.rep-maxes')
				.forEach((el) => el.remove());

			// Create rep maxes container
			const repMaxesContainer = createElement('div', {
				class: 'rep-maxes',
			});
			const repMaxesTitle = createElement('h3', {}, 'Rep Max Estimates:');
			repMaxesContainer.appendChild(repMaxesTitle);

			// Add rep max items
			repMaxes.forEach((rm) => {
				const repMaxItem = createElement(
					'div',
					{ class: 'rep-max-item' },
					`${rm.reps}RM: ${rm.weight}kg (Volume: ${rm.volume})`
				);
				repMaxesContainer.appendChild(repMaxItem);
			});

			inputContainer.remove();
			content.insertBefore(repMaxesContainer, errorElement);

			createWorkoutSet(
				remainingSets - 1,
				totalEffectiveVolume,
				currentOneRepMax
			);
		});

		inputContainer.append(weightInput, repsInput, rirInput, submitButton);
		content.insertBefore(inputContainer, errorElement);
	} else {
		document.querySelectorAll('.rep-maxes').forEach((el) => el.remove());

		const resultDisplay = createElement(
			'div',
			{ class: 'result-container' },
			`Total Effective Volume: ${accumulatedVolume.toFixed(2)}`
		);

		const restartButton = createElement(
			'button',
			{ class: 'restart-btn' },
			'Start New Session'
		);

		restartButton.addEventListener('click', () => location.reload());
		content.append(resultDisplay, restartButton);
	}
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
	const initialForm = document.getElementById('initial-form');
	const setsInput = document.getElementById('sets-input');
	const errorElement = document.getElementById('error');

	if (!initialForm || !setsInput || !errorElement) {
		console.error('Missing required elements. Check HTML structure.');
		return;
	}

	initialForm.addEventListener('submit', (e) => {
		e.preventDefault();

		const validation = validateNumericInput(setsInput);
		errorElement.innerHTML = '';
		errorElement.style.display = 'none';

		if (!validation.isValid) {
			errorElement.style.display = 'block';
			const errorItem = createElement(
				'div',
				{ class: 'error-item' },
				`• ${validation.error}`
			);
			errorElement.appendChild(errorItem);
			return;
		}

		initialForm.remove();
		createWorkoutSet(parseInt(setsInput.value));
	});
});
