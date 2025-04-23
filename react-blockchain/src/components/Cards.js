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
              id={1}
              src='images/blockchain-secure.jpg'
              backImage='images/blockchain-fig9-JZDddNw.png'
              text='Immutable Storage'
              label='Security'
              path='/upload'
              description='All reports cryptographically sealed on Ethereum with timestamp proof.'
            />
            <CardItem
              id={2}
              src='images/blockchain-verify.jpg'
              backImage='images/blockchain-verify-details.jpg'
              text='Instant Verification'
              label='Verification'
              path='/verify'
              description='Verify authenticity in seconds using blockchain transaction hashes.'
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
