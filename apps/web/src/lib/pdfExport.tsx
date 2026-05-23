"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf
} from "@react-pdf/renderer";
import type { AssignmentRecord, Difficulty, GeneratedAssessment } from "@vedai/shared";
import { questionTypeLabels } from "@vedai/shared";

const styles = StyleSheet.create({
  page: {
    padding: 42,
    fontSize: 10,
    color: "#1c211f",
    fontFamily: "Times-Roman",
    lineHeight: 1.35
  },
  header: {
    borderBottom: "1px solid #1c211f",
    paddingBottom: 12,
    marginBottom: 18
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Times-Bold"
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20
  },
  infoLine: {
    flexGrow: 1,
    borderBottom: "1px solid #555",
    paddingBottom: 5
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    marginBottom: 3
  },
  instruction: {
    color: "#555",
    marginBottom: 8
  },
  question: {
    marginBottom: 8
  },
  questionMeta: {
    color: "#5b625e",
    fontSize: 9,
    marginTop: 2
  }
});

function difficultyLabel(difficulty: Difficulty) {
  const labels: Record<Difficulty, string> = {
    easy: "Easy",
    medium: "Moderate",
    hard: "Hard"
  };
  return labels[difficulty];
}

function AssessmentPdf({ assessment }: { assessment: GeneratedAssessment }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{assessment.title}</Text>
          <View style={styles.meta}>
            <Text>{assessment.subject} · {assessment.grade}</Text>
            <Text>Time: {assessment.durationMinutes} min · Marks: {assessment.totalMarks}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <Text style={styles.infoLine}>Name:</Text>
          <Text style={styles.infoLine}>Roll No:</Text>
          <Text style={styles.infoLine}>Section:</Text>
        </View>

        {assessment.sections.map((section) => (
          <View style={styles.section} key={section.id}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.instruction}>{section.instruction}</Text>
            {section.questions.map((question, index) => (
              <View style={styles.question} key={question.id}>
                <Text>{index + 1}. {question.text}</Text>
                <Text style={styles.questionMeta}>
                  {difficultyLabel(question.difficulty)} · {questionTypeLabels[question.type]} · {question.marks} marks
                </Text>
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function downloadAssignmentPdf(assignment: AssignmentRecord) {
  if (!assignment.result) return;

  const blob = await pdf(<AssessmentPdf assessment={assignment.result} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${assignment.result.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-question-paper.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
