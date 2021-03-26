import utils from '@bigcommerce/stencil-utils';
import { confetti } from 'dom-confetti';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import ConsultantCard from '../common/consultant-card';

const KIT_PAGE = '/';
const PERSONAL_INFO_PAGE = '/tell-us-about-yourself/';
const CONFIRMATION_PAGE = '/welcome';

// localStorage selected sponsor item name
const SELECTED_SPONSOR = 'selectedSponsor';

class TSJoinProcess {
    constructor() {
        this.api = new TSApi();
        this.init();
    }

    init() {
        switch (document.location.pathname) {
            case KIT_PAGE:
                this.renderKit();
                break;
            case PERSONAL_INFO_PAGE:
                this.renderPersonalInfo();
                break;
            case CONFIRMATION_PAGE:
                this.renderCheckoutConfirmation();
                break;
            default:
                break;
        }
    }

    renderKit() {
        this.addKitCardHeaders();
        this.initIncludedItemsModal();
        this.removeSelectedSponsor();
        TSCookie.removeJoinCookies();

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

        // Input Cart Id from cookie
        const cartId = TSCookie.getCartId('joinCartId');
        $('#CartId').val(cartId);

        this.removeClassContainer();
        this.changePersonalInfoSelectValueStyling();
        this.togglePersonalInfoCheckboxes();
        this.formatPersonalInfoInputFields();
        this.renderFindSponsor();
        this.removeSelectedSponsor();
        this.clearFindSponsorSearch();
        this.openJoinAgreementModal();
        this.closeJoinAgreementModal();

        $('#checkout').on('click', (e) => this.goToCheckout(e));
    }

    renderCheckoutConfirmation() {
        this.triggerConfetti();
        this.showOrderNumber();
        this.updateSelectedSponsorCard();
        TSCookie.removeJoinCookies();
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

        $cards.map(function fn() {
            $(this).prepend(defaultHeaderHTML);
            $(this).prepend(highlightedHeaderHTML);

            return this;
        });
    }

    initIncludedItemsModal() {
        const $productIds = document.querySelectorAll('.kit-product-id');

        $productIds.forEach($id => {
            const id = $id.dataset.kitProductId;
            const $viewKitDetailsBtn = document.querySelector(`#view-kit-details-${id}`);
            const $modal = document.querySelector(`#bbok-${id}`);

            $modal.classList.add('kit-included-items-modal');

            $viewKitDetailsBtn.addEventListener('click', () => this.viewIncludedItemsModal($modal));
        });
    }

    viewIncludedItemsModal(modal) {
        const $modal = modal;

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

                TSCookie.setCartId(cart.id);
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
        this.toggleAgreementCheckbox();
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

    toggleAgreementCheckbox() {
        const $visibleCheckbox = this.$personalInfo.querySelector('#TermsCheckboxVisible');
        const $termsConditionsOptIn = this.$personalInfo.querySelector('#TermsOptIn');

        $visibleCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                $termsConditionsOptIn.checked = true;
            } else {
                $termsConditionsOptIn.checked = false;
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

        this.api.joinSignUp(this.getUserInfo())
            .done(() => {
                /* Store selected sponsor info in local storage.
                 * This info will be used in the confirmation page.
                 */
                const selectedSponsor = this.getSelectedSponsorInfo();
                localStorage.setItem(SELECTED_SPONSOR, JSON.stringify(selectedSponsor));

                // Store user's email to cookie
                const $emailInput = document.getElementById('Email');
                TSCookie.setJoinEmail($emailInput.value);

                window.location.href = '/checkout.php';
            })
            .fail(error => {
                this.displayCheckoutErrorMessages(error);
            });
    }

    getUserInfo() {
        return {
            nameDetail: {
                prefix: $('#Prefix').val(),
                preferredFirstName: $('#PreferredName').val(),
                legalFirstName: $('#FirstName').val(),
                lastName: $('#LastName').val(),
            },
            ssn: $('#SSN').val(),
            email: $('#Email').val(),
            verifyEmail: $('#VerifyEmail').val(),
            dateOfBirth: $('#BirthDate').val(),
            phoneDetail: {
                mobilePhone: $('#Phone').val(),
                mobileIsPrimary: $('#PhoneIsMobile').is(':checked'),
                primaryPhone: $('#PrimaryPhone').val(),
                smsOptIn: $('#SmsOptIn').is(':checked'),
            },
            cashOption: Number($('#CashOption').val()),
            cashOptionText: $('#CashOptionText').val(),
            consultantId: $('#ConsultantId').val(),
            agreement: {
                agreementSelected: $('#TermsOptIn').is(':checked'),
                version: Number($('#TermsVersion').val()),
            },
            cartid: $('#CartId').val(),
        };
    }

    getSelectedSponsorInfo() {
        const $consultantCard = $('.consultant-card.selected');

        return {
            cid: $consultantCard.data('cid') || null,
            afid: $consultantCard.data('afid') || null,
            image: $consultantCard.data('image') || null,
            name: $consultantCard.data('name') || null,
            title: $consultantCard.data('title') || null,
            phone: $consultantCard.data('phone') || null,
            email: $consultantCard.data('email') || null,
            location: $consultantCard.data('location') || null,
            weburl: $consultantCard.data('weburl') || null,
        };
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

    displayCheckoutErrorMessages(error) {
        if (error.responseJSON.errors) {
            const errors = error.responseJSON.errors;
            const checkoutErrors = this.checkoutErrorMessages(errors);

            checkoutErrors.forEach(checkoutError => {
                if (checkoutError.messages !== undefined) {
                    checkoutError.messages.forEach(message => {
                        $('#formErrorMessages').append(`
                            <li class="join__error">${message}</li>
                        `);
                    });
                }
                if (checkoutError.id === 'ConsultantId' && $('#sponsorSearchData').children.length > 0) {
                    document.getElementById('sponsorSearchData').style.border = '1px solid #D0021B';
                }
            });
            $('#formErrorMessages').append(`
                <h5 class="join__error" >If you continue to experience issues, please contact the 
                Customer Services team at 866.448.6446.</li>
            `);
        } else if (error) {
            $('#formErrorMessages').append(`
                <h4 class="join__error">${error.responseJSON}</h4>
            `);
        } else {
            $('#sponsorSearchData').append(`
                <h4  class="join__error">No results found.</h4>
            `);
        }
    }

    checkoutErrorMessages(errors) {
        return [
            { id: 'NameDetail.Prefix', messages: errors['NameDetail.Prefix'] },
            { id: 'NameDetail.PreferredFirstName', messages: errors['NameDetail.PreferredFirstName'] },
            { id: 'NameDetail.LegalFirstName', messages: errors['NameDetail.LegalFirstName'] },
            { id: 'NameDetail.LastName', messages: errors['NameDetail.LastName'] },
            { id: 'Email', messages: errors.Email },
            { id: 'VerifyEmail', messages: errors.VerifyEmail },
            { id: 'SSN', messages: errors.SSN },
            { id: 'DateOfBirth', messages: errors.DateOfBirth },
            { id: 'PhoneDetail.MobilePhone', messages: errors['PhoneDetail.MobilePhone'] },
            { id: 'PhoneDetail.PrimaryPhone', messages: errors['PhoneDetail.PrimaryPhone'] },
            { id: 'CashOptionText', messages: errors.CashOptionText },
            { id: 'ConsultantId', messages: errors.ConsultantId },
            { id: 'Agreement.AgreementSelected', messages: errors['Agreement.AgreementSelected'] },
        ];
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

        e.preventDefault();
        if (($('#txtConsultantID').val()) === '') {
            $('#sponsorSearchData').empty();
            $('#sponsorSearchData').append('Please enter a valid ID in the text box.');
        } else {
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

        e.preventDefault();
        if ($('#txtConsultantName').val() === '') {
            $('#sponsorSearchData').empty();
            $('#sponsorSearchData').append('Please enter a name in the text box and select a state');
        } else if ($('#ConsultantState').val() === null || $('#ConsultantState').val() === '') {
            $('#ConsultantState').css('border', '1px solid red');
        } else {
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

        e.preventDefault();
        if (($('#txtZipCode').val()) === '') {
            $('#sponsorSearchData').empty();
            $('#sponsorSearchData').append('Please enter a zip code in the text box.');
        } else {
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

    clearFindSponsorSearch() {
        $('#txtConsultantID').val('');
        $('#txtConsultantName').val('');
        $('#ConsultantState').val('');
        $('#txtZipCode').val('');
    }

    clearPersonalInfoErrorMessages() {
        $('#formErrorMessages').html('');

        if (document.getElementById('divTsConsFound')) {
            document.getElementById('divTsConsFound').style.display = 'none';
        }

        if (document.getElementById('sponsorSearchData')) {
            document.getElementById('sponsorSearchData').style.border = '';
            document.getElementById('ConsultantState').style.border = '';
        }
    }

    /**
     * END PERSONAL INFO FUNCTIONS
     */


    /**
     * CHECKOUT CONFIRMATION FUNCTIONS
     */

    triggerConfetti() {
        const confettiRoots = document.querySelectorAll('[data-fun]');
        confettiRoots.forEach(confettiRoot => confetti(confettiRoot));
    }

    showOrderNumber() {
        // Display order number in the page
        const orderId = TSCookie.getOrderId();
        const $orderNumber = document.querySelector('.join-order-number');
        $orderNumber.innerHTML = `<strong>Your order number is: ${orderId}</strong>`;
    }

    updateSelectedSponsorCard() {
        const consultant = JSON.parse(localStorage.getItem(SELECTED_SPONSOR));
        const $card = document.getElementById('selectedSponsorCard');
        let card = $card.innerHTML;

        const consultantImage =
            `<img
                src=${consultant.image}
                onerror="this.onerror=null;this.src='https://tso.tastefullysimple.com/_/media/images/noconsultantphoto.png';"
            />`;

        card = card.replace(/{consultant-image}/g, consultantImage);
        card = card.replace(/{consultant-name}/g, consultant.name ? consultant.name : '');
        card = card.replace(/{consultant-title}/g, consultant.title ? consultant.title : '');
        card = card.replace(/{consultant-phone}/g, consultant.phone ? consultant.phone : '');
        card = card.replace(/{consultant-email}/g, consultant.email ? consultant.email : '');
        card = card.replace(/{consultant-location}/g, consultant.location ? consultant.location : '');
        card = card.replace(/{consultant-weburl}/g, consultant.weburl ? consultant.weburl : '');

        $card.innerHTML = card;
    }

    /**
     * END CHECKOUT CONFIRMATION FUNCTIONS
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
        return (key === 35 || key === 36) || // Allow Home, End
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

    removeSelectedSponsor() {
        localStorage.removeItem(SELECTED_SPONSOR);
    }
}

export default function () {
    const joinProcess = new TSJoinProcess();
    return joinProcess;
}
