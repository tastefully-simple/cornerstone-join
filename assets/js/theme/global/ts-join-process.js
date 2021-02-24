import utils from '@bigcommerce/stencil-utils';

const KIT_PAGE = '/';
const PERSONAL_INFO_PAGE = '/tell-us-about-yourself/';

class TSJoinProcess {
    constructor() {
        this.init();
    }

    init() {
        switch(document.location.pathname) {
            case KIT_PAGE:
                this.renderKit();
                break;
            default:
                break;
        }
    }

    renderKit() {
        this.addKitCardHeaders();
        this.initIncludedItemsModal();

        // Auto-select the first Kit
        const $firstKitCard = $('.kit-card').first();
        $firstKitCard.addClass('selected');
        $firstKitCard.find('.kit-card-header').hide();

        // Initialize selected Kit Id
        const $productId = $('.kit-product-id').first();
        this.selectedKitId = $productId.data('kit-product-id');

        $('body').on('click', '.kit-card', (e) => this.selectKit(e));
        $('.kit-continue-btn').on('click', () => this.continueWithKitSelection());
    }

    /**
     * KIT FUNCTIONS
     */

    addKitCardHeaders() {
        const defaultHeaderHTML = `
            <div class="kit-card-header">
                <span class="fas fa-circle"></span>
                <div class="vertical-center">
                    <span class="selection-title">Select</span>
                </div>
            </div>
        `;

        const highlightedHeaderHTML = `
            <div class="selected-kit-card-header">
                <span class="icon-system-check"></span>
                <div class="vertical-center">
                    <span class="selection-title">Selected</span>
                </div>
            </div>
        `;

        const $cards = $('.kit-selector .kit-card');

        $cards.map(function() {
            $(this).prepend(defaultHeaderHTML);
            $(this).prepend(highlightedHeaderHTML);
        });
    }

    initIncludedItemsModal() {
        const $productIds = document.querySelectorAll('.kit-product-id');

        $productIds.forEach($id => {
            const id = $id.dataset.kitProductId;
            const $viewKitDetailsBtn = document.querySelector(`#view-kit-details-${id}`);

            $viewKitDetailsBtn.addEventListener('click', () => this.viewIncludedItemsModal(id));

        });
    }

    viewIncludedItemsModal(id) {
        const $modal = document.querySelector(`#bbok-${id}`);
        const $body = document.querySelector('body');

        /* Place the modal at the very bottom of body to avoid
         * header interrupting the modal's background
         */
        document.querySelector('body').appendChild($modal);

        $modal.style.display = 'block';

        const $closeBtns = $modal.querySelectorAll('.kit-included-items-close');
        $closeBtns.forEach($btn => {
            $btn.addEventListener('click', () => {
                $modal.style.display = 'none';
            });
        });
    }

    closeIncludedItems(id) {
        const $kitContent = document.querySelector(`#bbok-${id}`);
        $kitContent.style.display = 'none';
    }

    selectKit(e) {
        if ($(e.target).is('.view-kit-details-btn')) {
            return;
        }

        const $card = $(e.target).closest('.kit-card');

        $('.kit-card-header').show();

        // Update selectedKitId
        this.selectedKitId = $card.find('.kit-product-id').data('kit-product-id');
        $('.selected').toggleClass('selected');
        $card.find('.kit-card-header').hide();

        $(e.target).closest('.kit-card').toggleClass('selected');
    }

    continueWithKitSelection() {
        // Add selected kit to cart
        if (this.selectedKitId) {
            utils.api.cart.getCart({}, (getCartErr, cart) => {
                if (getCartErr) {
                    console.error('utils.api.cart.getCart::error', getCartErr);
                    return;
                }

                if (cart) {
                    /* Delete existing cart (to get rig of other items)
                     * and re-add kit if it's been added before
                     */
                    this.deleteCart(cart.id)
                        .then(_res => {
                            this.addSelectedKitToCart();
                        })
                        .catch(deleteErr => console.error('storefronAPI::deleteCart', deleteErr));
                } else {
                    // Cart is undefined, add kit
                    this.addSelectedKitToCart();
                }
            });
        }
    }

    addSelectedKitToCart() {
        const formData = new FormData();

        formData.append('action', 'add');
        formData.append('product_id', this.selectedKitId);
        formData.append('qty[]', '1');

        utils.api.cart.itemAdd(formData, (itemAddErr, _res) => {
            if (itemAddErr) {
                console.error('utils.api.cart.itemAdd::error', itemAddErr);
            }

            utils.api.cart.getCart({}, (getCartErr, cart) => {
                if (getCartErr) {
                    console.error('utils.api.cart.getCart::error', getCartErr);
                }

                window.location.href = PERSONAL_INFO_PAGE;
            });
        });
    }


    /**
     * END KIT FUNCTIONS
     */


    /**
     * HELPER FUNCTIONS
     */

    deleteCart(cartId) {
        return fetch(`/api/storefront/carts/${cartId}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}

export default function () {
    const joinProcess = new TSJoinProcess();
    return joinProcess;
}
