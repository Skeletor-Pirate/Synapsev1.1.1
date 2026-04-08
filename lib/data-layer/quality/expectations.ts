import { z } from 'zod';

export interface ExpectationResult {
  success: boolean;
  expectation_type: string;
  kwargs: Record<string, any>;
  exception_info?: string;
}

export interface ValidationReport {
  success: boolean;
  statistics: {
    evaluated_expectations: number;
    successful_expectations: number;
    unsuccessful_expectations: number;
    success_percent: number;
  };
  results: ExpectationResult[];
}

export class DataQualityValidator {
  private results: ExpectationResult[] = [];

  expectColumnToExist(data: any, column: string): this {
    const success = column in data;
    this.results.push({
      success,
      expectation_type: 'expect_column_to_exist',
      kwargs: { column },
    });
    return this;
  }

  expectColumnValuesToBeOfType(data: any, column: string, type: 'string' | 'number' | 'boolean'): this {
    const value = data[column];
    const success = typeof value === type;
    this.results.push({
      success,
      expectation_type: 'expect_column_values_to_be_of_type',
      kwargs: { column, type },
    });
    return this;
  }

  expectColumnValuesToBeBetween(data: any, column: string, min: number, max: number): this {
    const value = data[column];
    const success = typeof value === 'number' && value >= min && value <= max;
    this.results.push({
      success,
      expectation_type: 'expect_column_values_to_be_between',
      kwargs: { column, min, max },
    });
    return this;
  }

  expectColumnValuesToMatchRegex(data: any, column: string, regex: RegExp): this {
    const value = data[column];
    const success = typeof value === 'string' && regex.test(value);
    this.results.push({
      success,
      expectation_type: 'expect_column_values_to_match_regex',
      kwargs: { column, regex: regex.toString() },
    });
    return this;
  }

  validateSchema(data: any, schema: z.ZodSchema): this {
    const result = schema.safeParse(data);
    this.results.push({
      success: result.success,
      expectation_type: 'expect_schema_to_match',
      kwargs: { schema: 'ZodSchema' },
      exception_info: !result.success ? JSON.stringify(result.error.format()) : undefined,
    });
    return this;
  }

  getReport(): ValidationReport {
    const evaluated = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const unsuccessful = evaluated - successful;
    const success_percent = evaluated > 0 ? (successful / evaluated) * 100 : 100;

    return {
      success: unsuccessful === 0,
      statistics: {
        evaluated_expectations: evaluated,
        successful_expectations: successful,
        unsuccessful_expectations: unsuccessful,
        success_percent,
      },
      results: [...this.results],
    };
  }

  clear() {
    this.results = [];
  }
}

export const dq = new DataQualityValidator();
