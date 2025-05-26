import React from 'react';
import chim from '../../icons/chim.png'
const profileCom = () => {
    return (
        <div className="contentss">
           <div className='profile_top'>
               <div className='img'>사진</div>
               <div className='info'>
                  <div className='name'>돌멩이리듐</div>
                  <div className='role'>Web-Designer</div>
                  <div className='email'>💌okcoco03@naver.com</div>
                  <div className='grad'>🚩경상국립대학교 컴퓨터공학과 재학중</div>
              </div>
           </div>


           <div className='profile_explain'>
                <div className='content'> 안녕하세요! 저는 OpenAI에서 개발한 AI 모델로, 다양한 분야에서 사용자님의 질문에 답하고 도움을 드리고 있습니다. 언제나 친절하고 정확한 정보를 제공하기 위해 지속적으로 학습하고 있으며, 사용자의 요구에 맞춰 다양한 방식으로 소통할 수 있습니다. 문제 해결부터 창의적인 아이디어 제공까지, 필요한 모든 부분에서 도움을 드리고자 합니다. 저는 대화형 AI로서 자연스럽고 유익한 대화를 나누는 것을 목표로 하고 있습니다. 궁금한 점이나 도움이 필요하시면 언제든지 편하게 질문해주세요! 😊</div>
                <div className='tags'>
                    <div className='tag'>UI/UX</div>  
                    <div className='tag'>웹디자인</div>  
                    <div className='tag'>GPT4</div>

                    <div className='plus'>추가+</div>  
                </div>
           </div>

        <div className='profile_project semiTitle'>
                <div className='title'>참여 프로젝트</div>
                <div className='project-container'>

                    <div className='project_'>
                        <div className='info'>
                            <div className='date startDate'>2024.01.25</div>
                            <div className='date line'>|</div>
                            <div className='date endDate'>2024.02.25</div>
                            <div className='cooper'>@침착맨 유튜브 코퍼레이션</div>
                        </div>
                        <div className='project_name'>
                            <img src={chim} alt="chim" className="picture" />
                            <div className='name'>침투부 라디오편01 편집</div>
                            <div className='role'>편집  썸네일 제작</div>
                        </div>
                    </div>
                    <div className='project_'>
                        <div className='info'>
                            <div className='date startDate'>2024.01.25</div>
                            <div className='date line'>|</div>
                            <div className='date endDate'>2024.02.25</div>
                            <div className='cooper'>@침착맨 유튜브 코퍼레이션</div>
                        </div>
                        <div className='project_name'>
                            <img src={chim} alt="chim" className="picture" />
                            <div className='name'>침투부 라디오편01 편집</div>
                            <div className='role'>편집  썸네일 제작</div>
                        </div>
                    </div>
                    <div className='project_'>
                        <div className='info'>
                            <div className='date startDate'>2024.01.25</div>
                            <div className='date line'>|</div>
                            <div className='date endDate'>2024.02.25</div>
                            <div className='cooper'>@침착맨 유튜브 코퍼레이션</div>
                        </div>
                        <div className='project_name'>
                            <img src={chim} alt="chim" className="picture" />
                            <div className='name'>침투부 라디오편01 편집</div>
                            <div className='role'>편집  썸네일 제작</div>
                        </div>
                    </div>
                    <div className='project_'>
                        <div className='info'>
                            <div className='date startDate'>2024.01.25</div>
                            <div className='date line'>|</div>
                            <div className='date endDate'>2024.02.25</div>
                            <div className='cooper'>@침착맨 유튜브 코퍼레이션</div>
                        </div>
                        <div className='project_name'>
                            <img src={chim} alt="chim" className="picture" />
                            <div className='name'>침투부 라디오편01 편집</div>
                            <div className='role'>편집  썸네일 제작</div>
                        </div>
                    </div>



                </div>
        </div>

           <div className='profile_project semiTitle'>
                <div className='title'>개인 작업물</div>
                <div className='project_'>
                    <div className='info'>
                        <div className='date startDate'>2024.01.25</div>
                        <div className='date line'>|</div>
                        <div className='date endDate'>2024.02.25</div>
                    </div>
                    <div className='project_name'>
                        <div className='name'>썸네일 제작활동</div>
                        <div className='role explain'>섬넬 제작했다. 사람들이 좋아하더라구염?</div>
                    </div>
                </div>
           </div>

           <div className='profile_stack semiTitle'>
                <div className='title'>기술 스택</div>
                <div className='project_'>
                    <div className="stack">
                        <div className='stack_img'>img</div>
                        <div className='stack_name'>PYTHON</div>
                    </div>
                    <div className="stack">
                        <div className='stack_img'>img</div>
                        <div className='stack_name'>PremiumPro</div>
                    </div>
                    <div className="stack">
                        <div className='stack_img'>img</div>
                        <div className='stack_name'>GitHub</div>
                    </div>
                </div>
           </div>



        </div>
    );
};

export default profileCom;