import utils from '@bigcommerce/stencil-utils';

export default class ConsultantCard {
    /* Returns Promise that returns the consultant-card template */
    getTemplate() {
        const template = new Promise((resolve, _reject) => {
            utils.api.getPage('/', {
                template: 'common/consultant-card',
            }, (err, res) => {
                if (err) {
                    console.error('Error getting consultant-card template');
                    throw new Error(err);
                }

                resolve(res);
            });
        });

        return template;
    }

    /* Replaces placholder values of provided consultant-card template with data from consultant obj */
    insertConsultantData(card, consultant) {
        let newCard = card;

        newCard = newCard.replace(/{consultant-id}/g, consultant.ConsultantId ? consultant.ConsultantId : '');
        newCard = newCard.replace(/{consultant-afid}/g, consultant.AfId ? consultant.AfId : '');
        newCard = newCard.replace(/{consultant-imagesrc}/g, consultant.Image ? consultant.Image : '');
        newCard = newCard.replace(/{consultant-name}/g, consultant.Name ? consultant.Name : '');
        newCard = newCard.replace(/{consultant-title}/g, consultant.Title ? consultant.Title : '');
        newCard = newCard.replace(/{consultant-phone}/g, consultant.PhoneNumber ? consultant.PhoneNumber : '');
        newCard = newCard.replace(/{consultant-email}/g, consultant.EmailAddress ? consultant.EmailAddress : '');
        newCard = newCard.replace(/{consultant-location}/g, consultant.Location ? consultant.Location : '');
        newCard = newCard.replace(/{consultant-weburl}/g, consultant.WebUrl ? consultant.WebUrl : '');

        return newCard;
    }
}

