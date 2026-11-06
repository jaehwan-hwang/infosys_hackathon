package kr.hyu.isd.hackathon.domain.evaluation;

import kr.hyu.isd.hackathon.domain.team.Track;

import java.util.List;

/**
 * 트랙별 평가표. 운영진이 정한 평가기준.html을 그대로 옮겼다.
 *
 * 질문 문장이 곧 평가 항목 이름이다. 평가자는 항목마다 1~5점 중 하나를 고른다.
 * 배점은 그 항목이 총점에서 차지하는 몫이다 — 총점은 배점을 비율로 써서 늘 100점
 * 만점으로 환산한다(Evaluation 참고). 그래서 배점 합이 100이 아니어도 만점은 100점이다.
 *
 * 써밋은 참가자와 교수가 같은 항목으로 매긴다. 둘 다 100점 만점으로 환산된 뒤,
 * 집계에서 참가자 60%, 교수 40%로 합친다(ResultService).
 */
public final class EvaluationRubric {

    /** 항목마다 고를 수 있는 가장 높은 점수. 가장 낮은 점수는 1점이다. */
    public static final int MAX_SCORE = 5;
    public static final int MIN_SCORE = 1;

    /** @param points 평가기준.html의 배점 */
    public record Item(String question, int points) {
    }

    public static final List<Item> SPARK = List.of(
            new Item("주제로부터 논리적으로 문제를 도출하였나요? (문제 정의·타당성)", 30),
            new Item("제시한 아이디어가 명확하고 참신한가요?", 20),
            new Item("실제로 구현 가능한 아이디어인가요? (서비스 실현 가능성)", 20),
            new Item("제시한 아이디어가 타겟 고객층의 수요에 적합한가요?", 20),
            new Item("발표가 잘 전달됐나요? (프레젠테이션)", 10));

    public static final List<Item> SPRINT = List.of(
            new Item("제시한 아이디어가 명확하고 참신한가요?", 25),
            new Item("핵심 기능이 실제로 작동하나요? (핵심 기능의 동작성)", 25),
            new Item("제시한 아이디어가 파악한 문제를 해결하는데 효과적인가요?", 25),
            new Item("제시한 아이디어가 타겟 고객층의 수요에 적합한가요?", 25),
            new Item("발표가 잘 전달됐나요? (프레젠테이션)", 10));

    public static final List<Item> SUMMIT = List.of(
            new Item("제시한 아이디어가 명확하고 참신한가요?", 15),
            new Item("제시한 아이디어가 파악한 문제를 해결하는데 효과적인가요?", 15),
            new Item("실제로 출시해도 될 만한 서비스인가요? (서비스 완성도·상용화 가능성)", 20),
            new Item("화면이 쓰기 쉬운가요? (UI/UX 완성도)", 15),
            new Item("제시한 아이디어가 타겟 고객층의 수요에 적합한가요?", 15),
            new Item("서비스 구조가 탄탄한가요? (시스템 아키텍처·안정성)", 20),
            new Item("발표가 잘 전달됐나요? (프레젠테이션)", 10));

    /** 이 트랙을 이 평가자가 매길 때 쓰는 항목. 교수는 써밋만 평가한다. */
    public static List<Item> itemsFor(Track track, EvaluatorType evaluatorType) {
        if (evaluatorType == EvaluatorType.PROFESSOR) {
            return track == Track.SUMMIT ? SUMMIT : List.of();
        }
        return switch (track) {
            case SPARK -> SPARK;
            case SPRINT -> SPRINT;
            case SUMMIT -> SUMMIT;
        };
    }

    private EvaluationRubric() {
    }
}
