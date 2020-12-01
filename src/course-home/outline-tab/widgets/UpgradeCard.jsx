import React from 'react';
import PropTypes from 'prop-types';

import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Button } from '@edx/paragon';

import messages from '../messages';
import VerifiedCert from '../../../generic/assets/edX_verified_certificate.png';

function UpgradeCard({ intl }) {
  // This card is so custom and specific, that we do have a bit of custom styling here.
  // Making this kind of "upgrade" or "upsell" styling more broadly available would be something to look into.
  return (
    <section
      className="mb-3 p-4"
      style={{
        border: '1px solid #d9d9d9',
        borderTop: '5px solid #008100',
      }}
    >
      <h2 className="h6">{intl.formatMessage(messages.upgradeTitle)}</h2>
      <img
        alt={intl.formatMessage(messages.certAlt)}
        src={VerifiedCert}
        style={{ width: '124px' }}
      />
      <div className="float-right d-flex flex-column align-items-center">
        <Button
          variant="primary"
          style={{
            backgroundColor: '#008100',
            borderColor: '#008100',
          }}
          href={'http://edx.org/blarg'}
        >
          Upgrade ($149)
        </Button>
        <Button
          variant="link"
          size="sm"
        >
          Learn More
        </Button>
      </div>
    </section>
  );
}

UpgradeCard.propTypes = {
  intl: intlShape.isRequired,
};

UpgradeCard.defaultProps = {
};

export default injectIntl(UpgradeCard);
