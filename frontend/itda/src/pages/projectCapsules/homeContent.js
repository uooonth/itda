import React from 'react';
import search from '../../icons/search.svg';
import pinBefore from '../../icons/pinBefore.svg';

const HomeContent = () => {
    return (
        <div className="content">
            <div className="contentTitle">진행 프로젝트</div>
            <div className="searchBox">
                <div className="input">
                    <div className="icon"><img src={search} alt="search" /></div>
                    <input type="text" placeholder="검색할 프로젝트의 제목 혹은 게시자를 입력하세요." />
                </div>
            </div>
            <div className="searchHistroy">
                <div className="object">
                    침착맨
                    <div className="xBtn">X</div>
                </div>
                <div className="object">
                    침착맨 유튜브팀
                    <div className="xBtn">X</div>
                </div>
                <div className="btn">모두삭제</div>
            </div>
            <div className="projectList">
                <div className="title">nn개의 프로젝트가 있어요.</div>
                <div className="object">
                    <div className="object_icon">icon자리</div>
                    <div className="object_content">
                        <div className="title">침착맨 유튜브 편집팀</div>
                        <div className="explain">침착맨유튜브를 전문적으로 시청합시다</div>
                        <div className="status">
                            <div className="publisher">● 게시자 침착맨</div>
                            <div className="role">전문시청팀</div>
                        </div>
                    </div>
                    <div className="rightSide">
                        <img src={pinBefore} className="pin" alt="pin"/>
                        <div className="deadLine">2025.01.25 마감</div>
                        <div className="lastaccess">3일전 접속</div>
                    </div>
                </div>
                <div className="object">
                    <div className="object_icon">icon자리</div>
                    <div className="object_content">
                        <div className="title">침착맨 유튜브 편집팀</div>
                        <div className="explain">침착맨유튜브를 전문적으로 시청합시다</div>
                        <div className="status">
                            <div className="publisher">● 게시자 침착맨</div>
                            <div className="role">전문시청팀</div>
                        </div>
                    </div>
                    <div className="rightSide">
                        <img src={pinBefore} className="pin" alt="pin"/>
                        <div className="deadLine">2025.01.25 마감</div>
                        <div className="lastaccess">3일전 접속</div>
                    </div>
                </div>
                <div className="object">
                    <div className="object_icon">icon자리</div>
                    <div className="object_content">
                        <div className="title">침착맨 유튜브 편집팀</div>
                        <div className="explain">침착맨유튜브를 전문적으로 시청합시다</div>
                        <div className="status">
                            <div className="publisher">● 게시자 침착맨</div>
                            <div className="role">전문시청팀</div>
                        </div>
                    </div>
                    <div className="rightSide">
                        <img src={pinBefore} className="pin" alt="pin"/>
                        <div className="deadLine">2025.01.25 마감</div>
                        <div className="lastaccess">3일전 접속</div>
                    </div>
                </div>
                <div className="object">
                    <div className="object_icon">icon자리</div>
                    <div className="object_content">
                        <div className="title">침착맨 유튜브 편집팀</div>
                        <div className="explain">침착맨유튜브를 전문적으로 시청합시다</div>
                        <div className="status">
                            <div className="publisher">● 게시자 침착맨</div>
                            <div className="role">전문시청팀</div>
                        </div>
                    </div>
                    <div className="rightSide">
                        <img src={pinBefore} className="pin" alt="pin"/>
                        <div className="deadLine">2025.01.25 마감</div>
                        <div className="lastaccess">3일전 접속</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeContent;