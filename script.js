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

let allSets = [];

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

        const estimatedRepMaxes = estimateRepMaxes(
            calculateOneRepMax(weight, reps + rir)
        );

        document.querySelectorAll('.rep-maxes').forEach((el) => el.remove());
        const repMaxesContainer = createElement('div', { class: 'rep-maxes' });
        repMaxesContainer.appendChild(
            createElement('h3', {}, 'Rep Max Estimates:')
        );

        estimatedRepMaxes.forEach((rm) => {
            repMaxesContainer.appendChild(
                createElement(
                    'div',
                    { class: 'rep-max-item' },
                    `${rm.reps}RM: ${rm.weight.toFixed(2)}Kg`
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
    document
        .querySelectorAll('.inputs-container, .rep-maxes')
        .forEach((el) => el.remove());

    const setsSummary = generateSetSummary(allSets);
    localStorage.setItem('lastSetSummary', setsSummary);

    const buttonContainer = createElement('div', { class: 'button-container' });

    buttonContainer.append(
        createCopyButton(setsSummary),
        createRestartButton(setsSummary)
    );

    content.append(
        createElement(
            'div',
            { class: 'summary-container' },
            `Sets: ${setsSummary}`
        ),
        buttonContainer
    );
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

function createRestartButton(summaryToCopy) {
    const button = createElement(
        'button',
        { class: 'restart-btn' },
        'Start New Session'
    );
    button.addEventListener('click', () => {
        navigator.clipboard.writeText(summaryToCopy).then(() => {
            setTimeout(() => {
                location.reload();
            }, 200); // slight delay to allow clipboard to complete
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

document.addEventListener('DOMContentLoaded', () => {
    const initialForm = document.getElementById('initial-form');
    const setsInput = document.getElementById('sets-input');
    const errorElement = document.getElementById('error');
    const content = document.querySelector('.content');

    const lastSummary = localStorage.getItem('lastSetSummary');
    if (lastSummary) {
        const summaryContainer = createElement(
            'div',
            { class: 'summary-container' },
            `Last Session: ${lastSummary}`
        );
        const buttonContainer = createElement('div', { class: 'button-container' });
        buttonContainer.append(
            createCopyButton(lastSummary),
            createRestartButton(lastSummary)
        );
        content.append(summaryContainer, buttonContainer);
    }

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
