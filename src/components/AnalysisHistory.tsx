"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysisStore } from "@/store/analysisStore";
import {
  IconClock,
  IconMusic,
  IconFileText,
  IconTrash,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export default function AnalysisHistory() {
  const { analysisHistory, clearHistory } = useAnalysisStore();
  const [isHoveringClear, setIsHoveringClear] = useState(false);

  return (
    <div className="rounded-lg bg-orange-50 p-2 shadow-sm border border-orange-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center justify-between gap-3">
          <IconClock size={24} className="text-orange-500" />
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">Analysis History</h2>
          <Badge
            variant="outline"
            className="bg-orange-100 text-orange-700 border-orange-200"
          >
            {analysisHistory.length}{" "}
            {analysisHistory.length === 1 ? "item" : "items"}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearHistory}
          className={`border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all duration-200 ${
            isHoveringClear ? "bg-red-50 border-red-300 text-red-600" : ""
          }`}
          onMouseEnter={() => setIsHoveringClear(true)}
          onMouseLeave={() => setIsHoveringClear(false)}
        >
          <IconTrash size={16} className="mr-2" />
          Clear History
        </Button>
      </div>

      {analysisHistory.length > 0 ? (
        <ScrollArea className="rounded-lg border border-orange-200 h-[350px] md:h-[500px] bg-transparent">
          <Accordion type="multiple" className="w-full">
            {analysisHistory.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-b border-orange-100 last:border-b-0"
              >
                <AccordionTrigger className="hover:bg-orange-50 px-4 py-3 transition-all duration-200">
                  <div className="flex items-center gap-3 text-left">
                    <div className="bg-orange-100 p-2 rounded-md">
                      <IconMusic size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {item.fileName}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-700 text-xs"
                        >
                          {item.analysisResult.timeSignature}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-700 text-xs"
                        >
                          {item.analysisResult.keySignature}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-orange-200 bg-orange-50/50 overflow-hidden shadow-sm">
                      <CardHeader className="bg-orange-100/50 pb-2 pt-3">
                        <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                          <IconFileText size={18} />
                          Musical Elements
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-orange-700 font-medium text-sm">
                              Time Signature
                            </h4>
                            <p className="text-gray-700">
                              {item.analysisResult.timeSignature}
                            </p>
                          </div>
                          <Separator className="bg-orange-100" />
                          <div>
                            <h4 className="text-orange-700 font-medium text-sm">
                              Key Signature
                            </h4>
                            <p className="text-gray-700">
                              {item.analysisResult.keySignature}
                            </p>
                          </div>
                          <Separator className="bg-orange-100" />
                          <div>
                            <h4 className="text-orange-700 font-medium text-sm">
                              Tempo Markings
                            </h4>
                            <p className="text-gray-700">
                              {item.analysisResult.tempoMarkings}
                            </p>
                          </div>
                          <Separator className="bg-orange-100" />
                          <div>
                            <h4 className="text-orange-700 font-medium text-sm">
                              Dynamics
                            </h4>
                            <p className="text-gray-700">
                              {item.analysisResult.dynamics}
                            </p>
                          </div>
                          <Separator className="bg-orange-100" />
                          <div>
                            <h4 className="text-orange-700 font-medium text-sm">
                              Musical Instructions
                            </h4>
                            <p className="text-gray-700">
                              {item.analysisResult.musicalInstructions}
                            </p>
                          </div>
                          <Separator className="bg-orange-100" />
                          <div>
                            <h4 className="text-orange-700 font-medium text-sm">
                              Overall Structure
                            </h4>
                            <p className="text-gray-700">
                              {item.analysisResult.overallStructure}
                            </p>
                          </div>
                          <Separator className="bg-orange-100" />
                          <div>
                            <h4 className="text-orange-700 font-medium text-sm">
                              Harmonic Content
                            </h4>
                            <p className="text-gray-700">
                              {item.analysisResult.harmonicContent}
                            </p>
                          </div>
                          <Separator className="bg-orange-100" />
                          <div>
                            <h4 className="text-orange-700 font-medium text-sm">
                              Notable Features
                            </h4>
                            <p className="text-gray-700">
                              {item.analysisResult.notableFeatures}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50/50 overflow-hidden shadow-sm">
                      <CardHeader className="bg-orange-100/50 pb-2 pt-3">
                        <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                          <IconFileText size={18} />
                          Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-gray-700 leading-relaxed">
                          {item.summary}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      ) : (
        <div className="text-center py-12 bg-transparent rounded-lg border border-orange-200">
          <IconMusic size={48} className="text-orange-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            No analysis history available.
          </p>
          <p className="text-orange-600 text-sm mt-2">
            Upload and analyze a music score to get started!
          </p>
        </div>
      )}
    </div>
  );
}
