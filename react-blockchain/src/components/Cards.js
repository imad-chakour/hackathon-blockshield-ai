import React from 'react';
import './css/Cards.css';
import CardItem from './CardItem';

function Cards() {
  return (
    <div className='cards'>
      <h1>Blockchain Verification Features</h1>
      <div className='cards__container'>
        <div className='cards__wrapper'>
          <ul className='cards__items'>
            <CardItem
              src='images/blockchain-secure.jpg'
              text='Immutable report storage on Ethereum blockchain'
              label='Security'
              path='/upload'
            />
            <CardItem
              src='images/blockchain-verify.jpg'
              text='Instant verification of threat authenticity'
              label='Verification'
              path='/verify'
            />
          </ul>
          <ul className='cards__items'>
            <CardItem
              src='images/blockchain-tamper.jpg'
              text='Tamper-proof records with cryptographic hashing'
              label='Integrity'
              path='/about'
            />
            <CardItem
              src='images/blockchain-global.jpg'
              text='Worldwide accessible verification system'
              label='Global'
              path='/services'
            />
            <CardItem
              src='images/blockchain-trust.jpg'
              text='Trustless verification without intermediaries'
              label='Decentralized'
              path='/contact'
            />
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Cards;