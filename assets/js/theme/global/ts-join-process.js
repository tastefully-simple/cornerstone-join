import utils from '@bigcommerce/stencil-utils';
import TSApi from '../common/ts-api';
import ConsultantCard from '../common/consultant-card';

const KIT_PAGE = '/';
const PERSONAL_INFO_PAGE = '/tell-us-about-yourself/';

class TSJoinProcess {
    constructor() {
        this.api = new TSApi();
        this.init();
    }

    init() {
        switch(document.location.pathname) {
            case KIT_PAGE:
                this.renderKit();
                break;
            case PERSONAL_INFO_PAGE:
                this.renderPersonalInfo();
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

    renderPersonalInfo() {
        this.$personalInfo = document.getElementById('personal-info');

        this.removeClassContainer();
        this.changePersonalInfoSelectValueStyling();
        this.togglePersonalInfoCheckboxes();
        this.formatPersonalInfoInputFields();
        this.renderFindSponsor();
        this.openJoinAgreementModal();
        this.closeJoinAgreementModal();

        $('#checkout').on('click', (e) => this.goToCheckout(e));
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
     * PERSONAL INFO FUNCTIONS
     */

    /**
     * This function will change value styling once a value is selected and
     * handles display issues on apple devices.
     */
    changePersonalInfoSelectValueStyling() {
        const dates = this.$personalInfo.querySelectorAll('[type="date"]');
        const selectors = this.$personalInfo.querySelectorAll('[type="select"]');

        const addChangeHandler = (elementArray) => {
            elementArray.forEach((element) => {
                element.addEventListener('change', () => {
                    element.classList.remove('empty');
                });
            });
        };

        if (dates) { addChangeHandler(dates); }
        if (selectors) { addChangeHandler(selectors); }
    }

    togglePersonalInfoCheckboxes() {
        this.togglePrimaryPhoneCheckbox();
        this.toggleTextOptInCheckbox();
        this.toggleTsCashOtherCheckbox();
    }

    togglePrimaryPhoneCheckbox() {
        const $phoneCheckbox = this.$personalInfo.querySelector('#PhoneIsMobile');
        const $primaryPhone = this.$personalInfo.querySelector('#PrimaryPhone');
        const $primaryPhoneDiv = this.$personalInfo.querySelector('#primaryPhoneField');

        $phoneCheckbox.addEventListener('change', (e) => {
            if (!e.target.checked) {
                $primaryPhoneDiv.classList.remove('disabled');
                $primaryPhone.removeAttribute('disabled');
            } else {
                $('#primaryPhone').val('');
                $primaryPhoneDiv.classList.add('disabled');
                $primaryPhone.setAttribute('disabled', 'disabled');
            }
        });
    }

    toggleTextOptInCheckbox() {
        const $optInText = this.$personalInfo.querySelector('#SmsOptIn');

        $optInText.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.getElementById('SmsOptIn').checked = true;
            } else {
                document.getElementById('SmsOptIn').checked = false;
            }
        });
    }

    toggleTsCashOtherCheckbox() {
        const $cashOption = this.$personalInfo.querySelector('#CashOption');
        const $otherField = this.$personalInfo.querySelector('#tsCashOptionTextField');

        $cashOption.addEventListener('change', () => {
            const strCashOption = $cashOption.options[$cashOption.selectedIndex].text;
            if (strCashOption === 'Other:') {
                $otherField.classList.remove('hidden');
            } else {
                $otherField.classList.add('hidden');
            }
        });
    }

    formatPersonalInfoInputFields() {
        const $cellPhone = document.getElementById('Phone');
        $cellPhone.addEventListener('keydown', (e) => this.enforceFormat(e));
        $cellPhone.addEventListener('keyup', (e) => this.formatToPhone(e));

        const $primaryPhone = document.getElementById('PrimaryPhone');
        $primaryPhone.addEventListener('keydown', (e) => this.enforceFormat(e));
        $primaryPhone.addEventListener('keyup', (e) => this.formatToPhone(e));

        const $ssn = document.getElementById('SSN');
        $ssn.addEventListener('keydown', (e) => this.enforceFormat(e));
        $ssn.addEventListener('keyup', (e) => this.formatToSSN(e));
    }

    openJoinAgreementModal() {
        const $termsModal = this.$personalInfo.querySelector('#terms-modal');
        const $modalLink = this.$personalInfo.querySelector('#openTermsModal');

        this.getJoinAgreement();

        $modalLink.addEventListener('click', (e) => {
            e.preventDefault();
            $termsModal.classList.add('modal-overlay--active');
        });
    }

    closeJoinAgreementModal() {
        const $termsModal = this.$personalInfo.querySelector('#terms-modal');
        const $closeIcons = this.$personalInfo.querySelectorAll('.terms-close');

        $closeIcons.forEach(($closeIcon) => {
            $closeIcon.addEventListener('click', () => {
                $termsModal.classList.remove('modal-overlay--active');
            });
        });
    }

    getJoinAgreement() {
        this.api.getJoinAgreement()
            .done(data => {
                console.log("DATA", data);
                if (data !== null) {
                    document.getElementById('TermsVersion').value = data.Version;
                    $('#terms-conditions').append(`
                        <div>${data.HtmlMarkup}</div>
                    `);
                }
            })
            .fail(() => {
                $('#terms-conditions-backup').removeClass('hidden');
            });
    }

    goToCheckout(e) {
        e.preventDefault();

        this.setSubmissionDefaults();
        this.clearPersonalInfoErrorMessages();
        localStorage.setItem('isJoin', true);

        const $form = $('#frmJoinPersonalInfo');
        const disabled = $form.find(':input:disabled').removeAttr('disabled');
        const userInfo = $form.serialize();
        disabled.attr('disabled', 'disabled');

        console.log("USER INFO", userInfo);
    }

    setSubmissionDefaults() {
        if (this.$personalInfo.querySelector('#PhoneIsMobile').checked) {
            const $cellPhone = this.$personalInfo.querySelector('#Phone');

            if ($cellPhone.value) {
                this.$personalInfo.querySelector('#PrimaryPhone').value = $cellPhone.value;
            }
        }

        const $birthDate = this.$personalInfo.querySelector('#BirthDate');

        if ($birthDate.value) {
            let DOB = new Date($birthDate.value);
            DOB = new Date(DOB.getTime() + Math.abs(DOB.getTimezoneOffset() * 60000));
            const month = (String(DOB.getMonth() + 1)).length > 1 ? (DOB.getMonth() + 1) : `0${(DOB.getMonth() + 1)}`;
            const day = (String(DOB.getDate()).length > 1) ? (DOB.getDate()) : `0${(DOB.getDate())}`;
            const year = DOB.getFullYear();
            DOB = `${month}/${day}/${year}`;
            this.$personalInfo.querySelector('#Birthday').value = DOB;
        } else {
            this.$personalInfo.querySelector('#Birthday').value = '';
        }
    }

    /**
     * PERSONAL INFO - SPONSOR SEARCH
     */

    renderFindSponsor() {
        this.sponsorSearchParams = {
            consultantId: null,
            consultantName: null,
            consultantZipCode: null,
        };

        this.defaultSponsorData = {
            Results: [{
                ConsultantId: '0160785',
                EmailAddress: 'help@tastefullysimple.com',
                Location: 'Alexandria, MN',
                Name: 'Tastefully Simple',
                PhoneNumber: '866.448.6446',
                WebUrl: 'https://www.tastefullysimple.com/web/htstoyou',
                AfId: '1',
            }],
        };

        this.sponsorStateLocation = '';

        $('#consultantSearchForm').on('change', () => this.handleSponsorSearchFormChange(event));
        $('#btnConsIdSearch').on('click', (e) => this.searchSponsorById(e));
        $('#btnConsNameSearch').on('click', (e) => this.searchSponsorByName(e));
        $('#btnConsZipSearch').on('click', (e) => this.searchSponsorByZip(e));
    }

    handleSponsorSearchFormChange(e, _event) {
        const target = e.target;
        if (e.srcElement.form.id === 'consultantSearchForm'
            && target.name !== 'ConsultantState'
            && target.name !== 'TermsCheckboxVisible'
            && target.name !== 'openTermsModal') {
            this.sponsorSearchParams[target.name] = target.value;
        } else if (target.name === 'ConsultantState') {
            this.sponsorStateLocation = target.value;
        }
    }

    searchSponsorById(e) {
        this.clearPersonalInfoErrorMessages();
        this.removeEventHandlers();
        if (($('#txtConsultantID').val()) === '') {
            $('#sponsorSearchData').empty();
            e.preventDefault();
            $('#sponsorSearchData').append('Please enter a valid ID in the text box.');
        } else {
            e.preventDefault();
            $('#sponsorSearchData').empty();
            $('#txtConsultantName').val('');
            $('#txtZipCode').val('');
            const apiParams = `cid/${this.sponsorSearchParams.consultantId}`;
            this.getSponsor(apiParams);
        }
    }

    searchSponsorByName(e) {
        this.clearPersonalInfoErrorMessages();
        this.removeEventHandlers();
        if (($('#txtConsultantName').val()) === ''
            || (($('#ConsultantState').val()) === '')) {
            $('#sponsorSearchData').empty();
            e.preventDefault();
            $('#sponsorSearchData').append('Please enter a name in the text box and select a state');
        } else {
            e.preventDefault();
            $('#sponsorSearchData').empty();
            $('#txtConsultantID').val('');
            $('#txtZipCode').val('');
            const apiParams = `name/${this.sponsorSearchParams.consultantName}/${this.sponsorStateLocation}/1`;
            this.getSponsor(apiParams);
        }
    }

    searchSponsorByZip(e) {
        this.clearPersonalInfoErrorMessages();
        this.removeEventHandlers();
        if (($('#txtZipCode').val()) === '') {
            $('#sponsorSearchData').empty();
            e.preventDefault();
            $('#sponsorSearchData').append('Please enter a zip code in the text box.');
        } else {
            e.preventDefault();
            $('#sponsorSearchData').empty();
            $('#txtConsultantID').val('');
            $('#txtConsultantName').val('');
            const apiParams = `zip/${this.sponsorSearchParams.consultantZipCode}/200/1`;
            this.getSponsorByZip(apiParams);
        }
    }

    /**
     * Get Sponsor by ID or Name
     */
    getSponsor(apiParams) {
        this.api.getSponsor(apiParams)
            .done(data => {
                if (data.Results !== null) {
                    this.renderSponsorResult(data);
                }
            })
            .fail(error => {
                if (error.status >= 500 && error.status < 600) {
                    this.renderSponsorErrorMessage();
                } else {
                    this.sponsorOptedOutErrorMessage();
                }
            });
    }

    /**
     * Get Sponsor by ZIP
     */
    getSponsorByZip(apiParams) {
        this.api.getSponsor(apiParams)
            .done(data => {
                if (data.Results !== null) {
                    this.renderSponsorResult(data);
                }
            })
            .fail(error => {
                if (error.status >= 500 && error.status < 600) {
                    this.renderSponsorErrorMessage();
                } else {
                    document.getElementById('divTsConsFound').style.display = 'block';
                    this.renderSponsorResult(this.defaultSponsorData);
                }
            });
    }

    renderSponsorResult(data) {
        const consultantCard = new ConsultantCard();
        consultantCard.getTemplate().then(template => {
            data.Results.forEach((consultant) => {
                const consultantCardHtml = consultantCard.insertConsultantData(template, consultant);
                $('#sponsorSearchData').removeClass('sponsor-result--error');
                $('#sponsorSearchData').append(consultantCardHtml);
                if (data.Results.length < 3) {
                    $('#sponsorSearchData').addClass('no-scroll');
                } else {
                    $('#sponsorSearchData').removeClass('no-scroll');
                }
            });
            $('body').on('click', '#sponsorSearchData .consultant-card', (e) => {
                this.selectSponsor(e);
            });
        });
    }

    selectSponsor(e) {
        // If "View my TS page" link is clicked,
        // do nothing. Don't select the consultant
        if ($(e.target).is('.ts-page-link .framelink-lg')) {
            return;
        }

        $('.consultant-header').show();

        const $consultantCard = $(e.target).closest('.consultant-card');

        if (!$consultantCard.hasClass('selected')) {
            $('#sponsorSearchData .selected').toggleClass('selected');
            $consultantCard.addClass('selected');
            const cid = $consultantCard.data('cid') || null;
            $('#ConsultantId').val(cid);
            $consultantCard.find('.consultant-header').hide();
        } else {
            $consultantCard.find('.consultant-header').show();
            $consultantCard.removeClass('selected');
            $('#ConsultantId').val('');
        }
    }

    renderSponsorErrorMessage() {
        const $responseWrapper = $('#sponsorSearchData');
        $responseWrapper.addClass('sponsor-result--error');
        $responseWrapper.append('<p>An error has occurred.</p>');
    }

    sponsorOptedOutErrorMessage() {
        const $responseWrapper = $('#sponsorSearchData');
        $responseWrapper.addClass('sponsor-result--error');
        $responseWrapper.append(`
            <p>The consultant you are searching for is not currently sponsoring. In order to continue:</p>
            <ul>
                <li>Contact your consultant</li>
                <li>Contact HQ at 1.866.448.6446 or
                    <a class="textgray-text" href="mailto:help@tastefullysimple.com">help@tastefullysimple.com</a>
                </li>
            </ul>
        `);
    }

    clearPersonalInfoErrorMessages() {
        $('#formErrorMessages').html('');

        if (document.getElementById('divTsConsFound')) {
            document.getElementById('divTsConsFound').style.display = 'none';
        }

        if (document.getElementById('sponsorSearchData')) {
            document.getElementById('sponsorSearchData').style.border = '';
        }
    }

    /**
     * END PERSONAL INFO FUNCTIONS
     */

    /**
     * COMMON FUNCTIONS
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

    removeClassContainer() {
        document.querySelector('#main-content .container').classList.remove('container');
    }

    enforceFormat(e) {
        // Input must be of a valid number format or a modifier key, and not longer than ten digits
        if (!this.isNumericInput(e) && !this.isModifierKey(e)) {
            e.preventDefault();
        }
    }

    formatToPhone(e) {
        if (this.isModifierKey(e)) {
            return;
        }

        const target = e.target;
        const input = target.value.replace(/\D/g, '').substring(0, 10); // First ten digits of input only
        target.value = this.formatToPhoneSub(input);
    }

    formatToPhoneSub(inputValue) {
        const input = inputValue.replace(/\D/g, '').substring(0, 10); // First ten digits of input only
        const zip = input.substring(0, 3);
        const middle = input.substring(3, 6);
        const last = input.substring(6, 10);

        if (input.length > 6) {
            return `${zip}-${middle}-${last}`;
        } else if (input.length > 3) {
            return `${zip}-${middle}`;
        } else if (input.length > 0) {
            return `${zip}`;
        }
        return inputValue;
    }

    formatToSSN(e) {
        if (this.isModifierKey(e)) {
            return;
        }

        const target = e.target;
        const input = target.value.replace(/\D/g, '').substring(0, 9); // First ten digits of input only
        const zip = input.substring(0, 3);
        const middle = input.substring(3, 5);
        const last = input.substring(5, 9);

        if (input.length > 5) {
            target.value = `${zip}-${middle}-${last}`;
        } else if (input.length > 3) {
            target.value = `${zip}-${middle}`;
        } else if (input.length > 0) {
            target.value = `${zip}`;
        }
    }

    isNumericInput(e) {
        const key = e.keyCode;
        return ((key >= 48 && key <= 57) || // Allow number line
            (key >= 96 && key <= 105) // Allow number pad
        );
    }

    isModifierKey(e) {
        const key = e.keyCode;
        return (e.shiftKey === true || key === 35 || key === 36) || // Allow Shift, Home, End
            (key === 8 || key === 9 || key === 13 || key === 46) || // Allow Backspace, Tab, Enter, Delete
            (key > 36 && key < 41) || // Allow left, up, right, down
            (
                // Allow Ctrl/Command + A,C,V,X,Z
                (e.ctrlKey === true || e.metaKey === true) &&
                (key === 65 || key === 67 || key === 86 || key === 88 || key === 90)
            );
    }

    removeEventHandlers() {
        // TST-207
        // Remove click event so that when clicking the search button
        // in Find a Sponsor, selectConsultant() would not be called
        // multiple times
        $('body').off('click', '#sponsorSearchData .consultant-card');
    }
}

export default function () {
    const joinProcess = new TSJoinProcess();
    return joinProcess;
}
