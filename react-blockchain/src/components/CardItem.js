import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/CardFlip.css';

function CardItem(props) {
  const [flipped, setFlipped] = useState(false);
  const isFirstTwoCards = props.id <= 2; // Check if it's one of the first two cards

  const handleCardClick = (e) => {
    e.preventDefault();
    setFlipped(!flipped);
  };

  return (
    <li className='cards__item'>
      <Link className='cards__item__link' to={props.path} onClick={handleCardClick}>
        <div className={`card-inner ${flipped ? 'is-flipped' : ''}`}>
          {/* Front of Card (same for all) */}
          <div className='card-front'>
            <figure className='cards__item__pic-wrap' data-category={props.label}>
              <img
                className='cards__item__img'
                alt={props.text}
                src={props.src}
                loading="lazy"
              />
            </figure>
            <div className='cards__item__info'>
              <h5 className='cards__item__text'>{props.text}</h5>
            </div>
          </div>

          {/* Back of Card (different for first two) */}
          <div className='card-back'>
            {isFirstTwoCards ? (
              <>
                <figure className='cards__item__pic-wrap'>
                  <img
                    className='cards__item__img'
                    alt={props.text + " details"}
                    src={props.backImage || props.src} // Use backImage if provided
                    loading="lazy"
                  />
                </figure>
                <div className='cards__item__info'>
                  <h5 className='cards__item__text'>🔍 {props.label}</h5>
                  <p className="card-description">{props.description}</p>
                </div>
              </>
            ) : (
              <div className='cards__item__info'>
                <h5 className='cards__item__text'>🔍 {props.label}</h5>
                <p className="card-description">More about: <strong>{props.text}</strong></p>
                <p className="card-description">
                  {props.description || 'This feature ensures trust, security, and transparency using Ethereum blockchain.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

export default CardItem;