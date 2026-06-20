'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import type { UserProfile, Province, SubjectCategory, Region, FamilyBackground, CareerGoal } from '@/lib/types';

const STEPS = [
  { id: 1, title: '基本信息', description: '选择省份和输入分数' },
  { id: 2, title: '选科类型', description: '选择您的选科组合' },
  { id: 3, title: '专业偏好', description: '输入感兴趣的专业' },
  { id: 4, title: '地域偏好', description: '选择希望就读的地区' },
  { id: 5, title: '就业诉求', description: '选择未来发展方向' },
];

const PROVINCES: { value: Province; label: string }[] = [
  { value: 'zhejiang', label: '浙江省' },
  { value: 'shandong', label: '山东省' },
];

const SUBJECT_CATEGORIES: { value: SubjectCategory; label: string; desc: string }[] = [
  { value: 'physics_chemistry', label: '物理+化学', desc: '工科、理科类专业' },
  { value: 'history_politics', label: '历史+政治', desc: '文科类专业' },
  { value: 'physics_history', label: '物理+历史', desc: '部分工科和文科专业' },
  { value: 'chemistry_biology', label: '化学+生物', desc: '医学、农学类专业' },
  { value: 'other', label: '其他组合', desc: '请根据实际情况选择' },
];

const REGIONS: { value: Region; label: string }[] = [
  { value: 'east', label: '华东地区' },
  { value: 'south', label: '华南地区' },
  { value: 'north', label: '华北地区' },
  { value: 'west', label: '西部地区' },
  { value: 'central', label: '华中地区' },
  { value: 'northeast', label: '东北地区' },
];

const CAREER_GOALS: { value: CareerGoal; label: string; desc: string }[] = [
  { value: 'employment', label: '就业优先', desc: '优先考虑就业率高、薪资好的专业' },
  { value: 'postgraduate', label: '考研深造', desc: '优先考虑学术性强、考研机会多的专业' },
  { value: 'stable', label: '稳定就业', desc: '优先考虑公务员、教师、医生等稳定职业' },
  { value: 'flexible', label: '综合考量', desc: '综合考虑就业、升学、兴趣等多方面因素' },
];

const POPULAR_MAJORS = [
  '计算机科学与技术',
  '软件工程',
  '人工智能',
  '电子信息工程',
  '电气工程及其自动化',
  '临床医学',
  '汉语言文学(师范)',
  '数学与应用数学(师范)',
  '法学',
  '经济学',
  '金融学',
  '会计学',
];

export default function InputPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    province: undefined,
    score: undefined,
    rank: undefined,
    subjectCategory: undefined,
    preferredMajors: [],
    excludedMajors: [],
    preferredRegions: [],
    familyBackground: undefined,
    careerGoal: undefined,
  });

  const progress = ((currentStep - 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.province !== undefined && formData.score !== undefined && formData.score > 0;
      case 2:
        return formData.subjectCategory !== undefined;
      case 3:
        return true; // 专业偏好可选
      case 4:
        return true; // 地域偏好可选
      case 5:
        return formData.careerGoal !== undefined;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // 完成所有步骤，生成报告
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // 构建完整的用户数据
    const completeData: UserProfile = {
      province: formData.province!,
      score: formData.score!,
      rank: formData.rank || null,
      subjectCategory: formData.subjectCategory!,
      preferredMajors: formData.preferredMajors || [],
      excludedMajors: formData.excludedMajors || [],
      preferredRegions: formData.preferredRegions || [],
      familyBackground: formData.familyBackground || 'ordinary',
      careerGoal: formData.careerGoal!,
      createdAt: new Date(),
    };

    // 存储到sessionStorage用于后续页面
    sessionStorage.setItem('userProfile', JSON.stringify(completeData));

    // 跳转到预览页
    router.push('/preview');
  };

  const updateFormData = (updates: Partial<UserProfile>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleMajor = (major: string, isPreferred: boolean) => {
    const key = isPreferred ? 'preferredMajors' : 'excludedMajors';
    const current = formData[key] || [];
    const updated = current.includes(major)
      ? current.filter(m => m !== major)
      : [...current, major];
    updateFormData({ [key]: updated });
  };

  const toggleRegion = (region: Region) => {
    const current = formData.preferredRegions || [];
    const updated = current.includes(region)
      ? current.filter(r => r !== region)
      : [...current, region];
    updateFormData({ preferredRegions: updated });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">志</span>
            </div>
            <span className="font-semibold text-lg text-foreground">
              AI志愿填报助手
            </span>
          </Link>
          <span className="text-sm text-muted-foreground">
            步骤 {currentStep}/{STEPS.length}
          </span>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {STEPS.map((step, idx) => (
            <span
              key={step.id}
              className={idx + 1 <= currentStep ? 'text-primary font-medium' : ''}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 pb-24">
        <Card className="shadow-sm">
          <CardContent className="p-6 md:p-8">
            {/* Step 1: 基本信息 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">基本信息</h2>
                  <p className="text-sm text-muted-foreground">
                    请选择您所在的省份并输入高考分数
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="province" className="text-base font-medium">
                      省份
                    </Label>
                    <RadioGroup
                      value={formData.province}
                      onValueChange={(value: Province) => updateFormData({ province: value })}
                      className="grid grid-cols-2 gap-3 mt-2"
                    >
                      {PROVINCES.map(prov => (
                        <div key={prov.value} className="flex items-center">
                          <RadioGroupItem value={prov.value} id={prov.value} />
                          <Label htmlFor={prov.value} className="ml-2 cursor-pointer">
                            {prov.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="score" className="text-base font-medium">
                      高考分数
                    </Label>
                    <Input
                      id="score"
                      type="number"
                      placeholder="请输入您的分数"
                      value={formData.score ?? ''}
                      onChange={(e) => updateFormData({ score: parseInt(e.target.value) || undefined })}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.province === 'zhejiang'
                        ? '浙江高考满分750分'
                        : formData.province === 'shandong'
                        ? '山东高考满分750分'
                        : '请先选择省份'}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="rank" className="text-base font-medium">
                      位次（可选）
                    </Label>
                    <Input
                      id="rank"
                      type="number"
                      placeholder="如有位次信息请输入"
                      value={formData.rank ?? ''}
                      onChange={(e) => updateFormData({ rank: parseInt(e.target.value) || null })}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      如无位次信息，系统将根据分数估算
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: 选科类型 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">选科类型</h2>
                  <p className="text-sm text-muted-foreground">
                    请选择您的高考选科组合，这将影响可选专业范围
                  </p>
                </div>

                <RadioGroup
                  value={formData.subjectCategory}
                  onValueChange={(value: SubjectCategory) => updateFormData({ subjectCategory: value })}
                  className="space-y-3"
                >
                  {SUBJECT_CATEGORIES.map(cat => (
                    <div key={cat.value} className="flex items-start p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={cat.value} id={cat.value} className="mt-1" />
                      <div className="ml-3">
                        <Label htmlFor={cat.value} className="font-medium cursor-pointer">
                          {cat.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {cat.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 3: 专业偏好 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">专业偏好</h2>
                  <p className="text-sm text-muted-foreground">
                    选择您感兴趣的专业（可多选）和不喜欢的专业
                  </p>
                </div>

                <div>
                  <Label className="text-base font-medium">感兴趣的专业</Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    点击选择您感兴趣的专业方向
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {POPULAR_MAJORS.map(major => (
                      <div
                        key={major}
                        onClick={() => toggleMajor(major, true)}
                        className={`p-2 text-sm rounded-lg border cursor-pointer transition-all ${
                          formData.preferredMajors?.includes(major)
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {major}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">不喜欢的专业</Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    点击选择您不希望就读的专业（可多选）
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {POPULAR_MAJORS.slice(0, 8).map(major => (
                      <div
                        key={major}
                        onClick={() => toggleMajor(major, false)}
                        className={`p-2 text-sm rounded-lg border cursor-pointer transition-all ${
                          formData.excludedMajors?.includes(major)
                            ? 'bg-destructive/10 border-destructive text-destructive'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {major}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: 地域偏好 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">地域偏好</h2>
                  <p className="text-sm text-muted-foreground">
                    选择您希望就读的地区（可多选，不选则不限地域）
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {REGIONS.map(region => (
                    <div
                      key={region.value}
                      onClick={() => toggleRegion(region.value)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.preferredRegions?.includes(region.value)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.preferredRegions?.includes(region.value)}
                          className="pointer-events-none"
                        />
                        <span className="font-medium">{region.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: 就业诉求 */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">就业诉求</h2>
                  <p className="text-sm text-muted-foreground">
                    选择您对未来发展的主要诉求，这将影响专业推荐权重
                  </p>
                </div>

                <RadioGroup
                  value={formData.careerGoal}
                  onValueChange={(value: CareerGoal) => updateFormData({ careerGoal: value })}
                  className="space-y-3"
                >
                  {CAREER_GOALS.map(goal => (
                    <div key={goal.value} className="flex items-start p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={goal.value} id={goal.value} className="mt-1" />
                      <div className="ml-3">
                        <Label htmlFor={goal.value} className="font-medium cursor-pointer">
                          {goal.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {goal.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:p-6">
        <div className="max-w-xl mx-auto flex gap-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              上一步
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {currentStep === STEPS.length ? '生成报告' : '下一步'}
          </Button>
        </div>
      </div>
    </div>
  );
}