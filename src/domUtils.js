const RUNWAY_CLASS = '__runway';
const SLICE_CLASS = '__slice';

export function insertAfter($new, $ref) {
    $ref.parentNode.insertBefore($new, $ref.nextSibling);
}

export function getOrCreateElements($container) {
    let $runway = $container.querySelector(`.${RUNWAY_CLASS}`);
    let $slice = $container.querySelector(`.${SLICE_CLASS}`);

    if (!$runway) {
        $runway = document.createElement('div');
        $runway.setAttribute('class', RUNWAY_CLASS);
        $container.appendChild($runway);
    }

    if (!$slice) {
        $slice = document.createElement('div');
        $slice.setAttribute('class', SLICE_CLASS);
        $runway.appendChild($slice);
    }

    return [$runway, $slice];
}

