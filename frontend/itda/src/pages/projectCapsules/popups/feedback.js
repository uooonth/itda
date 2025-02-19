import React from 'react';

const FeedbackPopup = ({ onClose }) => {
    return (
        <div className="feedbackPopup">
            <div className="popupContent">
                <button className="closeBtn" onClick={onClose}>X</button>
                <div className="popupBody">
                    {/* 팝업 내용 */}
                </div>
            </div>
        </div>
    );
};

export default FeedbackPopup;