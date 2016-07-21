// A note on focus handling
// One of the following things will happen:
//  - A focused element is removed from the DOM:
//    We should remember it and try to reapply focus until we have a reason
//    to think that another node is now the focus target.
//  - A previously focused element is added back to the DOM
//  - Another element has been focused since the last render
export default function restoreFocus($target, sideEffects, { $activeElement }={}) {
    if ($activeElement && document.activeElement !== document.body) {
        // Something else got focused, we can forget about restoring focus
        // to our element.
        $activeElement = undefined;
    }
    let blurListener = (e) => {
        $activeElement = e.target;
    };
    $target.addEventListener('blur', blurListener, true);
    sideEffects();
    $target.removeEventListener('blur', blurListener, true);

    // If we have an active element and nothing's focused, it's worth trying to
    // refocus as the element might have been added back.
    if ($activeElement && document.activeElement === document.body) {
        $activeElement.focus();
    }
    // Did refocusing work?
    let didRestoreFocus = false;
    if (document.activeElement === $activeElement) {
        didRestoreFocus = true;
        // Refocusing worked, so we can forget our active element
        $activeElement = undefined;
    }

    return [ didRestoreFocus, $activeElement ];
}
