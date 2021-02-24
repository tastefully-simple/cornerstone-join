class Tooltip {
    constructor() {
        $('.close-tooltip').on('click', () => this.closeTooltip());
    }

    closeTooltip() {
        $('.tooltip-content.is-open').removeClass('is-open');
    }
}

export default function () {
    const tooltip = new Tooltip();
    return tooltip;
}
